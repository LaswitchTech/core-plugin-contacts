<?php

require_once realpath(__DIR__ . '/../../Model.php');

class ContactsPostModel extends ContactsModel {

    /**
     * Post process a record
     *
     * @param array $record
     * @return array
     */
    public function post($record): array
    {
        // Check if the record ID is below 9999
        if($record['id'] <= 9999) return $record;

        // Loop through the record
        foreach($record as $key => $value){

            // Handle specific fields
            switch($key){
                case 'targetTable':
                    if(in_array($value, ['leads', 'clients', 'importers'])){
                        $Query = $this->Database->query()->table($value)->select('*')->where('id', $record['targetId'])->limit(1);
                        $original = $Query->fetch();
                        if(!empty($original)){
                            $original = $original[array_key_first($original)];
                            if(!empty($original) && array_key_exists('vcard', $original) && !empty($original['vcard']) && !is_null($original['vcard'])){
                                $record[$key] = 'vcards';
                                $record['targetId'] = $original['vcard'];
                            }
                        }
                    }
                    break;
                default:
                    break;
            }
        }

        // Return the record
        return $record;
    }
}
