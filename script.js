// Check if the task has a contact
function process_function_hasContact(task, value, callback = null){

    // Loop through the contact list
    if(typeof task.target !== 'undefined'){

        // Ajax Request
        API.endpoint('/contacts/fetchAll').data({
            conditions: [
                {key: 'targetTable', operator: '=', value: task.targetTable},
                {key: 'targetId', operator: '=', value: task.targetId},
                {key: 'isArchived', operator: '<>', value: 1},
            ]
        }).execute(function(response){
            for(const [id, contact] of Object.entries(response.records ?? {})){
                if($.isArray(contact.vcard.role) && contact.vcard.role.includes(value)){
                    if(typeof callback === "function"){
                        callback(task, contact);
                    }
                    break;
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
