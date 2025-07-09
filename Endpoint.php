<?php

// Import additionnal class into the global namespace
use \LaswitchTech\Core\Base\BaseEndpoint;

class ContactsEndpoint extends BaseEndpoint {

    /**
     * Constructor
     */
    public function __construct()
    {
        // Call the parent constructor
        parent::__construct();

        // Initialize the Endpoint
        $this->init('contacts');

        // Set Properties
        $this->required = ['email','name','phone','locale','targetTable','targetId'];
        $this->optional = ['tollfree','mobile','fax','tags','dba','industries','businessNumber','taxExtension','importerExtension','website','address','city','country','state','zipcode'];
    }

    /**
     * Create a record
     */
    public function createAction(): array
    {
        // Call the parent constructor
        $message = parent::createAction();

        // Check if the record is accessible
        if($message['status'] == 200){

            // Retrieve the parameters
            $parameters = $message['data']['parameters'];

            // Initialize the fields array
            $fields = [];

            // Check if the Event Plugin is accessible
            if($this->Helper->Core->isInstalled('event')){

                // Initialize the Events
                $message['data']['event'] = [];

                // Setup a new event
                $event = [
                    'category' => 'Contact',
                    'message' => 'New Contact Created by <vcard>'.$this->Auth->user()->vcard['id'].':'.$this->Auth->user()->username.'</vcard>',
                    'icon' => 'circle',
                    'color' => 'secondary',
                    'link' => '/plugin/contacts/details?id='.$message['data']['record']['id'],
                    'targetTable' => 'contacts',
                    'targetId' => $message['data']['record']['id'],
                ];

                // Create the event
                $message['data']['event'][] = $this->Model->Event->create($event);
            }

            // Check if the vCards Plugin is accessible
            if($this->Helper->Core->isInstalled('vcards')){

                // Initialize the record
                $record = $parameters;

                // Set the vCard category
                $record['category'] = 'Contact';

                // Create the vCard
                $fields['vcard'] = $this->Model->Vcards->create($record);

                // Add in the message
                $message['data']['record']['vcard'] = $this->Model->Vcards->fetch($fields['vcard']);

                // Check if the Event Plugin is accessible
                if($this->Helper->Core->isInstalled('event')){

                    // Setup a new event
                    $event = [
                        'category' => 'vCard',
                        'message' => 'New vCard Created by <vcard>'.$this->Auth->user()->vcard['id'].':'.$this->Auth->user()->username.'</vcard>',
                        'icon' => 'circle',
                        'color' => 'secondary',
                        'link' => '/plugin/'.$message['data']['record']['targetTable'].'/details?id='.$message['data']['record']['targetId'],
                        'targetTable' => 'contacts',
                        'targetId' => $message['data']['record']['id'],
                    ];

                    // Create the event
                    $message['data']['event'][] = $this->Model->Event->create($event);
                }
            }

            // Check if tags is set
            if($this->Helper->Core->isInstalled('tags') && array_key_exists('tags', $parameters) && !empty($parameters['tags'])){

                // Loop through the tags
                foreach($parameters['tags'] ?? [] as $key => $tag){

                    // Check if the tag is not empty
                    if(!empty($tag)){

                        // Create the tag
                        $this->Model->Tags->create(['name' => $tag]);
                    }
                }
            }

            // Check if industries is set
            if($this->Helper->Core->isInstalled('industries') && array_key_exists('industries', $parameters) && !empty($parameters['industries'])){

                // Loop through the industries
                foreach($parameters['industries'] ?? [] as $key => $industry){

                    // Check if the industry is not empty
                    if(!empty($industry)){

                        // Create the industry
                        $this->Model->Industries->create(['name' => $industry]);
                    }
                }
            }

            // Check if $fields is empty
            if(!empty($fields)){
                $affectedRows = $this->Model->Contacts->update($message['data']['record']['id'], $fields);
            }
        }

        // Return the message
        return $message;
    }

    /**
     * Archive a record
     */
    public function archiveAction(): array
    {
        // Call the parent constructor
        $message = parent::archiveAction();

        // Check if the record is accessible
        if($message['status'] == 200){

            // Check if the Event Plugin is accessible
            if($this->Helper->Core->isInstalled('event')){

                // Initialize the Events
                $message['data']['event'] = [];

                // Setup a new event
                $event = [
                    'category' => 'Contact',
                    'message' => 'Contact Archived by <vcard>'.$this->Auth->user()->vcard['id'].':'.$this->Auth->user()->username.'</vcard>',
                    'icon' => 'circle',
                    'color' => 'secondary',
                    'link' => '/plugin/contacts/details?id='.$message['data']['record']['id'].'&name='.urlencode($message['data']['record']['vcard']['name']),
                    'targetTable' => 'contacts',
                    'targetId' => $message['data']['record']['id'],
                ];

                // Create the event
                $message['data']['event'][] = $this->Model->Event->create($event);

                // Setup a new event for the task
                $event['link'] = '/plugin/'.$message['data']['record']['targetTable'].'/index?id='.$message['data']['record']['targetId'];
                $event['targetTable'] = $message['data']['record']['targetTable'];
                $event['targetId'] = $message['data']['record']['targetId'];

                // Create the event
                $message['data']['event'][] = $this->Model->Event->create($event);
            }
        }

        // Return the message
        return $message;
    }

    /**
     * Recover a record
     */
    public function recoverAction(): array
    {
        // Call the parent constructor
        $message = parent::recoverAction();

        // Check if the record is accessible
        if($message['status'] == 200){

            // Check if the Event Plugin is accessible
            if($this->Helper->Core->isInstalled('event')){

                // Initialize the Events
                $message['data']['event'] = [];

                // Setup a new event
                $event = [
                    'category' => 'Contact',
                    'message' => 'Contact Recovered by <vcard>'.$this->Auth->user()->vcard['id'].':'.$this->Auth->user()->username.'</vcard>',
                    'icon' => 'circle',
                    'color' => 'secondary',
                    'link' => '/plugin/contacts/details?id='.$message['data']['record']['id'].'&name='.urlencode($message['data']['record']['vcard']['name']),
                    'targetTable' => 'contacts',
                    'targetId' => $message['data']['record']['id'],
                ];

                // Create the event
                $message['data']['event'][] = $this->Model->Event->create($event);

                // Setup a new event for the task
                $event['link'] = '/plugin/'.$message['data']['record']['targetTable'].'/index?id='.$message['data']['record']['targetId'];
                $event['targetTable'] = $message['data']['record']['targetTable'];
                $event['targetId'] = $message['data']['record']['targetId'];

                // Create the event
                $message['data']['event'][] = $this->Model->Event->create($event);
            }
        }

        // Return the message
        return $message;
    }
}
