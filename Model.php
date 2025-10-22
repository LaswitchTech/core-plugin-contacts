<?php

// Import additionnal class into the global namespace
use \LaswitchTech\Core\Base\BaseModel;

class ContactsModel extends BaseModel {

    /**
     * Constructor
     */
    public function __construct()
    {
        // Call the parent constructor
        parent::__construct();

        // Initialize the Model
        $this->init('contacts');
    }

    /**
     * Process a record
     *
     * @param array $record
     * @return array
     */
    protected function process(array $record): array
    {
        // Call the parent constructor
        $record = parent::process($record);

        // Check if the record has role
        if(array_key_exists('vcard', $record) && !empty($record['vcard'])){
            if(array_key_exists('role', $record['vcard']) && !empty($record['vcard']['role']) && !is_array($record['vcard']['role'])){

                // Process the roles
                $record['vcard']['role'] = json_decode($record['vcard']['role'] ?? "[]", true);
            }
        }

        // Return the processed record
        return $record;
    }

    /**
     * Apply Joins to the Query
     *
     * @param Query $Query
     * @return Query
     */
    protected function joins(object $Query): object
    {
        // Apply Joins
        $Query->join('vcard', 'vcards', 'id');

        return $Query;
    }
}
