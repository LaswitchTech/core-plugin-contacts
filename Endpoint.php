<?php

/**
 * Core Framework - ContactsEndpoint
 *
 * @license    MIT (https://mit-license.org/)
 * @author     Louis Ouellet <louis@laswitchtech.com>
 */

// Import additionnal class into the global namespace
use \LaswitchTech\Core\Abstracts\Endpoint;

class ContactsEndpoint extends Endpoint {

    /**
     * Constructor
     */
    public function __construct()
    {

        // Call Parent Constructor
        parent::__construct();

        // Retrieve the namespace
        $namespace = $this->Request->getNamespace();

        // Set Global access
        $this->Public = false;

        // Set Properties
        switch($namespace){
            case "/contacts/index":
                $this->Level = 1;
                break;
            case "/contacts/create":
                $this->Level = 2;
                break;
            case "/contacts/archive":
            case "/contacts/recover":
                $this->Level = 4;
                break;
        }
    }

    /**
     * Create a Contact
     */
    public function createAction(): array
    {
        // Import Global Variables
        global $CSRF;

        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Check the request method
        if($this->Request->getMethod() == "POST"){
            $message["data"]["CSRF"] = [
                "token" => $CSRF->token(),
                "key" => $CSRF->key()
            ];
        }

        // Check if the Note is accessible
        if($message['status'] == 200){

            // Check the request method
            if($this->Request->getMethod() == "POST"){

                // Retrieve the parameters
                $parameters = $this->Request->getParams('REQUEST');

                // Sanitize the parameters
                foreach($parameters as $key => $value){
                    if(empty($value)){
                        unset($parameters[$key]);
                    } else {
                        if(!in_array($key,['country','state','locale','email','targetTable','targetId','website','zipcode'])){
                            if(in_array($key,['tags','industries']) && !is_array($value)){
                                $value = json_decode($value, true);
                                $parameters[$key] = $value;
                            }
                            if(!is_array($value)){
                                $parameters[$key] = ucwords(strtolower($value));
                            } else {
                                foreach($value as $k => $v){
                                    $parameters[$key][$k] = ucwords(strtolower($v));
                                }
                            }
                            if(in_array($key,['lead','client'])){
                                $parameters[$key] = intval($value);
                            }
                        }
                    }
                }

                // Set Required Fields
                $required = ['email','name','phone','locale','targetTable','targetId'];

                // Set Optional Fields
                $optional = ['lead','client','title','role','address','city','country','state','zipcode','tollfree','mobile','fax','website','tags','industries'];

                // Set Unique Fields
                $unique = ['id','created','modified','owner','organization'];

                // Check if all required fields are set
                if(count(array_intersect_key(array_flip($required), $parameters)) == count($required)){

                    // Initialize the Events
                    $message['data']['events'] = [];

                    // Retrieve the user's username and vCard
                    $owner = $this->Auth->user()->username;
                    $organization = $this->Auth->user()->organization()->id;
                    $vCard = $this->Auth->user()->vcard();

                    // Initialize the vCard
                    $vcard = [
                        'owner' => $owner,
                        'organization' => $organization,
                        'category' => 'Contact'
                    ];

                    // Setup the vCard
                    foreach($required as $key){
                        if(isset($parameters[$key])){
                            $vcard[$key] = $parameters[$key];
                        }
                    }
                    foreach($optional as $key){
                        if(isset($parameters[$key])){
                            $vcard[$key] = $parameters[$key];
                        }
                    }
                    unset($vcard['targetTable']);
                    unset($vcard['targetId']);
                    $vcardId = $this->Model->Vcards->create($vcard);

                    // Initialize the contact
                    $contact = [
                        'owner' => $owner,
                        'organization' => $organization,
                        'vcard' => $vcardId,
                        'targetTable' => $parameters['targetTable'],
                        'targetId' => $parameters['targetId']
                    ];
                    $contactId = $this->Model->Contacts->create($contact);

                    // Check if tags is set
                    if(isset($parameters['tags'])){
                        foreach($parameters['tags'] as $key => $tag){
                            $this->Model->Tags->create($tag);
                        }
                    }

                    // Check if industries is set
                    if(isset($parameters['industries'])){
                        foreach($parameters['industries'] as $key => $industry){
                            $this->Model->Industries->create($industry);
                        }
                    }

                    // Check if a target object has been created
                    if($vcardId && $contactId){

                        // Retrieve the final lead
                        $message['data']['record'] = $this->Model->Contacts->get($contactId);

                        if(isset($parameters['targetTable']) && isset($parameters['targetId'])){

                            // Create the an event
                            $message['data']['events'][] = $this->Model->Event->create($owner, $parameters['targetTable'], $parameters['targetId'], 'Contact', '<vcard>'.$vCard['id'].':'.$this->Auth->user()->username.'</vcard> has created <vcard>'.$vcardId.':'.$vcard['name'].'</vcard>.');
                        }
                    } else {
                        $message['status'] = 500;
                        $message['message'] = "Internal Server Error";
                        $message['data']['error'] = "The contact could not be created.";
                    }
                } else {
                    $message['status'] = 400;
                    $message['message'] = "Bad Request";
                    $message['data']['error'] = "Some required fields are missing [";
                    foreach($required as $key){
                        if(!array_key_exists($key, $parameters)){
                            $message['data']['error'] .= $key.", ";
                        }
                    }
                    $message['data']['error'] = rtrim($message['data']['error'], ", ");
                    $message['data']['error'] .= "]";
                }
            } else {
                $message = ["status" => 405, "message" => "Method Not Allowed", "data" => "The method is not allowed for the requested URL."];
            }
        }

        return $message;
    }

    /**
     * retrieve a list of Contacts
     */
    public function indexAction(): array
    {
        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Check if the Note is accessible
        if($message['status'] == 200){

            // Check the request method
            if($this->Request->getMethod() == "GET"){

                // Retrieve the parameters
                $parameters = $this->Request->getParams('REQUEST');

                // Set Required Fields
                $required = ['targetTable','targetId'];

                // Check if all required fields are set
                if(count(array_intersect_key(array_flip($required), $parameters)) == count($required)){

                    // Retrieve the contacts
                    $message['data']['records'] = $this->Model->Contacts->list($parameters['targetTable'], intval($parameters['targetId']));
                } else {
                    $message['status'] = 400;
                    $message['message'] = "Bad Request";
                    $message['data']['error'] = "Some required fields are missing [";
                    foreach($required as $key){
                        if(!array_key_exists($key, $parameters)){
                            $message['data']['error'] .= $key.", ";
                        }
                    }
                    $message['data']['error'] = rtrim($message['data']['error'], ", ");
                    $message['data']['error'] .= "]";
                }
            } else {
                $message = ["status" => 405, "message" => "Method Not Allowed", "data" => "The method is not allowed for the requested URL."];
            }
        }

        return $message;
    }

    /**
     * Archive a Contact
     */
    public function archiveAction(): array
    {
        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Retrieve the Contact
        $contact = $this->Model->Contacts->get(intval($this->Request->getParams('GET','id')));

        // Check if the Contact is accessible
        if(empty($contact)){
            $message = ["status" => 404, "message" => "Not Found", "data" => "Could not find the requested contact."];
        } else {
            if($contact['organization']['id'] != $this->Auth->user()->organization()->id){
                $message = ["status" => 403, "message" => "Forbidden", "data" => "You are not allowed to access this contact."];
            }
        }

        // Check if the Note is accessible
        if($message['status'] == 200){

            // Check the request method
            if($this->Request->getMethod() == "GET"){

                // Update the Contact
                $this->Model->Contacts->update($contact['id'], ["isArchived" => 1]);

                // Retrieve the Updated Contact
                $message["data"]["record"] = $this->Model->Contacts->get($contact['id']);
            } else {
                $message = ["status" => 400, "message" => "Bad Request", "data" => "Invalid Request Method"];
            }
        }

        return $message;
    }

    /**
     * Recover a Contact
     */
    public function recoverAction(): array
    {
        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Retrieve the Contact
        $contact = $this->Model->Contacts->get(intval($this->Request->getParams('GET','id')));

        // Check if the Contact is accessible
        if(empty($contact)){
            $message = ["status" => 404, "message" => "Not Found", "data" => "Could not find the requested contact."];
        } else {
            if($contact['organization']['id'] != $this->Auth->user()->organization()->id){
                $message = ["status" => 403, "message" => "Forbidden", "data" => "You are not allowed to access this contact."];
            }
        }

        // Check if the Note is accessible
        if($message['status'] == 200){

            // Check the request method
            if($this->Request->getMethod() == "GET"){

                // Update the Contact
                $affectedRows = $this->Model->Contacts->update($contact['id'], ["isArchived" => 0]);

                // Retrieve the Updated Contact
                $message["data"]["record"] = $this->Model->Contacts->get($contact['id']);
            } else {
                $message = ["status" => 400, "message" => "Bad Request", "data" => "Invalid Request Method"];
            }
        }

        return $message;
    }
}
