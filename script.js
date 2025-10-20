// Check if the task has a contact
function process_function_hasContact(task, value, callback = null){

    // Loop through the contact list
    if(typeof task.target !== 'undefined'){

        // Array of advance target tables
        const advancedTables = ['clients','leads','importers'];
        const advancedColumns = {'client':'clients','lead':'leads','importer':'importers','vcard':'vcards'};

        // Initialize Promises Array
        const Promises = [];

        // Create a Promise to fetch contacts based on the targetTable and targetId
        Promises.push(new Promise((resolve, reject) => {

            // Ajax Request
            API.endpoint('/contacts/fetchAll').data({
                conditions: [
                    {key: 'targetTable', operator: '=', value: task.targetTable},
                    {key: 'targetId', operator: '=', value: task.targetId},
                    {key: 'isArchived', operator: '<>', value: 1},
                ],
            }).suppress().execute(function(response){
                resolve(response.records ?? {});
            }, function(){
                resolve({});
            });
        }));

        // Check if the target table is in array
        if(advancedTables.includes(task.targetTable)){

            // Loop through the advance target tables
            for(const column of advancedColumns){

                // Get the table name for the advance target table
                const table = advancedColumns[table];

                // Skip if the table is the same as the task target table
                if(table === task.targetTable) continue;

                // Check if the target has the advance target table loaded
                if(typeof task.target[column] === 'undefined' || task.target[column] === null || typeof task.target[column]?.id === 'undefined' || task.target[column]?.id === null){
                    continue;
                }

                // Add a Promise to fetch contacts based on the advance targetTable and targetId
                Promises.push(new Promise((resolve, reject) => {

                    // Ajax Request
                    API.endpoint('/contacts/fetchAll').data({
                        conditions: [
                            {key: 'targetTable', operator: '=', value: table},
                            {key: 'targetId', operator: '=', value: task.target[column]?.id ?? null},
                            {key: 'isArchived', operator: '<>', value: 1},
                        ],
                    }).suppress().execute(function(response){
                        resolve(response.records ?? {});
                    }, function(){
                        resolve({});
                    });
                }));
            }
        }

        // Execute all Promises and stop when one of them finds a matching contact
        Promise.all(Promises).then(results => {
            for(const records of results){
                for(const [id, contact] of Object.entries(records)){
                    if($.isArray(contact.vcard.role) && contact.vcard.role.includes(value)){
                        if(typeof callback === "function"){
                            callback(task, contact);
                        }
                        return;
                    }
                }
            }
        });
    }
}
function process_meta_hasContact(key = null){
    const metadata = {
        label: "Check for a contact",
        description: "Check if the task's target has a contact with the specified role",
        placeholder: "Select an option",
        type: "select",
        options: [
            {id: 'Other', text: builder.Locale.get('Other')},
            {id: 'General', text: builder.Locale.get('General')},
            {id: 'Billing', text: builder.Locale.get('Billing')},
            {id: 'Administrator', text: builder.Locale.get('Administrator')},
            {id: 'Owner', text: builder.Locale.get('Owner')},
        ],
    };
    return metadata[key] ? metadata[key] : metadata;
}
