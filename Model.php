<?php

/**
 * Core Framework - ContactsModel
 *
 * @license    MIT (https://mit-license.org/)
 * @author     Louis Ouellet <louis@laswitchtech.com>
 */

// Import additionnal class into the global namespace
use \LaswitchTech\Core\Abstracts\Model;

class ContactsModel extends Model {

    /**
     * Create a new contact and return the id
     *
     * @param array $data
     * @return int
     */
    public function create(array $data): int
    {
        // Create the Query
        $Query = $this->Database->query()
            ->table('contacts')
            ->insert($data);

        // Execute the Query
        $affectedRows = $Query->execute();

        // Execute the Query
        return $Query->lastId();
    }

    /**
     * Update a contact
     *
     * @param int $id
     * @param array $data
     * @return int
     */
    public function update(int $id, array $data): int
    {
        // Create the Query
        $Query = $this->Database->query()
            ->table('contacts')
            ->update($data)
            ->where('id', $id);

        // Execute the Query
        return $Query->execute();
    }

    /**
     * Retrieve Contacts List
     *
     * @param string $table
     * @param int $id
     * @return array
     */
    public function list(string $table, int $id): array
    {
        // Create the Query
        $Query = $this->Database->query()
            ->table($table)
            ->select('*')
            ->join('owner', 'users', 'username')
            ->join('vcard', 'vcards', 'id')
            ->join('organization', 'organizations', 'id')
            ->filter()
            ->where('id', 9999, '<>')
            ->where('id', $id)
            ->where('isArchived', 1, '<>')
            ->limit(1);

        // Retrieve the Results
        $target = $Query->fetch();

        // Check if the target exists
        if(empty($target)){
            return [];
        } else {
            $target = $target[array_key_first($target)];
            $target['vcard']['tags'] = json_decode($target['vcard']['tags'] ?? '[]', true);
            $target['vcard']['industries'] = json_decode($target['vcard']['industries'] ?? '[]', true);
        }

        // Create the Query
        $Query = $this->Database->query()
            ->table('contacts')
            ->select('*')
            ->join('owner', 'users', 'username')
            ->join('vcard', 'vcards', 'id')
            ->join('organization', 'organizations', 'id')
            ->filter()
            ->where('id', 9999, '<>')
            ->where('isArchived', 1, '<>')
            ->where('targetTable', $table)
            ->where('targetId', $id);

        // Check if the target is a lead or a client
        switch($table){
            case 'leads':
                $Query->filter('OR')->where('targetTable', 'clients')->where('targetId', $target['client']);
                break;
            case 'clients':
                $Query->filter('OR')->where('targetTable', 'leads')->where('targetId', $target['lead']);
                break;
        }

        // Retrieve the Results
        $results = $Query->fetch();

        // Decode JSON Fields
        foreach($results as $key => $record){

            // Decode JSON Fields
            $result[$key]['vcard']['tags'] = json_decode($record['vcard']['tags'] ?? '[]', true);
            $result[$key]['vcard']['industries'] = json_decode($record['vcard']['industries'] ?? '[]', true);
        }

        // Append the target to the results
        $results[] = $target;

        // Return the Results
        return $results;
    }

    /**
     * Retrieve Contact's Details
     *
     * @param int $id
     * @return array
     */
    public function get(int $id): array
    {
        // Create the Query
        $Query = $this->Database->query()
            ->table('contacts')
            ->select('*')
            ->join('owner', 'users', 'username')
            ->join('vcard', 'vcards', 'id')
            ->join('organization', 'organizations', 'id')
            ->filter()
            ->where('id', 9999, '<>')
            ->where('isArchived', 0)
            ->filter()
            ->where('id', $id)
            ->limit(1);

        // Retrieve the Results
        $result = $Query->result();

        // Decode JSON Fields
        foreach($result as $key => $record){

            // Decode JSON Fields
            $result[$key]['vcard']['tags'] = json_decode($record['vcard']['tags'] ?? '[]', true);
            $result[$key]['vcard']['industries'] = json_decode($record['vcard']['industries'] ?? '[]', true);
        }

        // Return the Results
        return $result[array_key_first($result)] ?? [];
    }
}
