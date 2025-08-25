const ContactModalCreate = function(list, fields = {}){
    builder.Component(
        "modal",
        null,
        {
            onEnter: false,
            destroy: true,
            icon: "plus-lg",
            title: builder.Locale.get("Create a contact"),
            cancel: false,
            submit: true,
            size: "xl",
            callback: {
                submit: function(element,modal){
                    element.form.submit();
                },
            },
        },
        function(modal,component){
            const componentModal = component;
            component.addClass('modal-success');
            component.footer.submit.addClass('btn-success').removeClass('btn-link').attr({
                "style": "border-bottom-right-radius: var(--bs-modal-inner-border-radius) !important;border-bottom-left-radius: var(--bs-modal-inner-border-radius) !important;",
            }).text(builder.Locale.get('Create'));
            component.footer.submit.icon = $(document.createElement('i')).addClass('bi bi-stars me-1').prependTo(component.footer.submit);
            component.form = builder.Component(
                'form',
                component.body,
                {
                    class:{
                        form: 'row row-cols-3',
                        field: 'mb-3 col',
                    },
                    callback:{
                        val: function(values){
                            for(const [key, value] of Object.entries(fields)){
                                if(typeof values[key] === 'undefined'){
                                    values[key] = value;
                                }
                            }
                            return values;
                        },
                        submit: function(form){
                            console.log(form.val());
                            $.ajax({
                                url: '/api/contacts/create',
                                headers: {'X-CSRF-Authorization': CSRF_KEY},
                                type: 'POST',dataType: 'json',
                                data: form.val(),
                                success: function(response) {

                                    // Add the contact to the list
                                    list.add(
                                        {},
                                        function(item,list){

                                            // Format the contact
                                            ContactFormat(item, response.record);
                                        },
                                    );

                                    // Close the modal
                                    modal.hide();
                                }
                            });
                        },
                    },
                },
                function(form,component){
                    vCardForm(form,fields,componentModal);
                    modal.show();
                },
            );
        },
    );
}
const ContactModalArchive = function(contact, elementContact = null){

    // Create a modal
    builder.Component(
        "modal",
        null,
        {
            onEnter: false,
            destroy: true,
            icon: "archive",
            title: builder.Locale.get("Are you sure you?"),
            body: builder.Locale.get("Your are about to archive this contact. Are you sure you want to continue?"),
            cancel: false,
            submit: true,
            callback: {
                submit: function(element,modal){

                    // Create a spinner animate-rotate
                    var spinner = $(document.createElement('div')).attr({
                        "class": "animate-rotate rounded-circle border border-secondary border-4 d-none",
                        "style": "width: 96px; height: 96px; border-top-color: var(--bs-primary)!important;",
                    }).appendTo(element);

                    // Hide the dialog
                    element.dialog.addClass('opacity-0');

                    // Setup a spinner while waiting for the modal to be submitted
                    setTimeout(() => {

                        // Hide the dialog
                        element.dialog.hide();

                        // Add flex to the modal
                        element.addClass('d-flex align-items-center justify-content-center');

                        // Show the spinner
                        spinner.removeClass('d-none');

                        // AJAX Request
                        $.ajax({
                            url: '/api/contacts/archive?id='+contact.id,
                            type: 'GET',dataType: 'json',
                            success: function(response) {

                                // Remove the element
                                if(elementContact){
                                    elementContact.remove();
                                }

                                // Hide the modal
                                modal.hide();
                            }
                        });
                    }, 300);
                },
            },
        },
        function(modal,component){

            // Save the component
            const componentModal = component;

            // Style the modal
            component.addClass('modal-dark');
            component.footer.submit.addClass('btn-dark').removeClass('btn-link').attr({
                "style": "border-bottom-right-radius: var(--bs-modal-inner-border-radius) !important;border-bottom-left-radius: var(--bs-modal-inner-border-radius) !important;",
            }).text(builder.Locale.get('Archive'));
            component.footer.submit.icon = $(document.createElement('i')).addClass('bi bi-archive me-1').prependTo(component.footer.submit);

            // Open the modal
            modal.show();
        },
    );
}
const ContactFormat = function(element, contact){

    // Set attributes
    element.attr({
        "data-id": contact.id,
        "data-type": "contact",
    })

    // Set Styling
    element.container.addClass('px-3');
    element.removeClass('cursor-pointer').css('transition', '0.5s ease-in-out');

    // Setup a grid
    element.field.container = $(document.createElement('div')).addClass('d-flex justify-content-start align-items-center cursor-pointer').appendTo(element.field);
    element.field.container.avatar = $(document.createElement('div')).addClass('flex-shrink-1 rounded-circle border border-3 border-light d-flex justify-content-center align-items-center').css({height:"64px",width:"64px"}).appendTo(element.field.container);
    element.field.container.content = $(document.createElement('div')).addClass('flex-grow-1 d-flex flex-column justify-content-center align-items-start ms-3').appendTo(element.field.container);
    element.field.container.content.line1 = $(document.createElement('div')).addClass('text-nowrap my-1').appendTo(element.field.container.content);
    element.field.container.content.line2 = $(document.createElement('div')).addClass('text-nowrap my-1').appendTo(element.field.container.content);
    element.field.container.controls = $(document.createElement('div')).addClass('flex-shrink-1 d-flex justify-content-center align-items-center').appendTo(element.field.container);

    // on hover Add text-bg-secondary to the item
    element.field.container.hover(
        function(){
            element.addClass('text-bg-secondary');
        },
        function(){
            element.removeClass('text-bg-secondary');
        },
    );

    // Open modal when clicking on the contact
    element.field.container.avatar.click(function(){
        vCardModal(contact.vcard.id, contact.vcard.name);
    });
    element.field.container.content.click(function(){
        vCardModal(contact.vcard.id, contact.vcard.name);
    });

    // Add the avatar
    element.avatar = builder.Component(
        "avatar",
        element.field.container.avatar,
        {
            class: {
                component: "rounded-circle",
            },
            email: contact.vcard.email,
            size: "64px",
        },
    );

    // Add the name
    element.name = $(document.createElement('span')).addClass('fs-5 fw-lighter').text(contact.vcard.name).appendTo(element.field.container.content.line1);
    element.title = $(document.createElement('span')).addClass('badge ms-2 text-bg-secondary').text(contact.vcard.title).appendTo(element.field.container.content.line1);
    element.role = $(document.createElement('span')).appendTo(element.field.container.content.line1);
    for(const [key, role] of Object.entries(contact.vcard.role ?? [])){
        $(document.createElement('span')).addClass('badge ms-2 text-bg-warning').text(role).appendTo(element.role);
    }
    element.phone = $(document.createElement('a')).attr('href','tel:'+contact.vcard.phone).addClass('btn btn-sm btn-primary').html('<i class="me-1 bi bi-telephone"></i>'+contact.vcard.phone).appendTo(element.field.container.content.line2);
    element.email = $(document.createElement('a')).attr('href','mailto:'+contact.vcard.email).addClass('btn btn-sm btn-primary ms-2').html('<i class="me-1 bi bi-envelope"></i>'+contact.vcard.email).appendTo(element.field.container.content.line2);

    // Add the actions
    element.field.container.controls.actions = $(document.createElement('div')).addClass('btn-group').appendTo(element.field.container.controls);
    element.field.container.controls.actions.edit = $(document.createElement('button')).attr({
        'class': 'btn btn-sm btn-warning',
        'data-action': 'edit',
        'type': 'button',
    }).html('<i class="bi bi-pencil"></i>').appendTo(element.field.container.controls.actions);
    element.field.container.controls.actions.edit.click(function(){
        vCardModalEdit(contact.vcard);
    });
    element.field.container.controls.actions.archive = $(document.createElement('button')).attr({
        'class': 'btn btn-sm btn-dark',
        'data-action': 'archive',
        'type': 'button',
    }).html('<i class="bi bi-archive"></i>').appendTo(element.field.container.controls.actions);
    element.field.container.controls.actions.archive.click(function(){
        ContactModalArchive(contact, element);
    });

    // Remove the icon and the actions container
    setTimeout(() => {
        if(typeof element.container.icon !== 'undefined'){
            element.container.icon.remove();
        }
        if(typeof element.field !== 'undefined'){
            element.field.removeClass('px-1 py-2 ps-2 pe-0').addClass('p-2');
        }
        if(typeof element.actions !== 'undefined'){
            element.actions.remove();
        }
    }, 100);
}
const ContactsFeed = function(contacts, container, defaults = {}, callback = null){

    // Initialize the list's tools and actions
    var Tools = {
        add: {
            icon: "plus-lg",
            label: builder.Locale.get("Add someone..."),
            color: "success",
            callback: function(tool,list){
                ContactModalCreate(list, defaults);
            },
        },
    };

    // Get the keys as numbers, sort them in reverse order
    const sortedKeys = Object.keys(contacts).map(Number).sort((a, b) => b - a);

    // Create the list
    builder.Component(
        "list",
        container,
        {
            class: {
                component: "w-100 rounded bg-transparent border-0 shadow-none",
                item: "rounded-top-0",
            },
            tools: Tools,
            icon: 'stick',
        },
        function(list,component){

            // Loop through the contacts
            for(const [key, id] of Object.entries(sortedKeys)){
                const contact = contacts[id];

                // Add the contact to the list
                list.add(
                    {},
                    function(item,list){

                        // Format the contact
                        ContactFormat(item, contact);
                    },
                );
            }
        },
    );
}

// Check if the task has a contact
function process_function_hasContact(task, value, callback = null){

    // Loop through the contact list
    if(typeof task.target !== 'undefined'){

        // Ajax Request
        $.ajax({
            url: '/api/contacts/fetchAll?targetTable='+task.targetTable+'&targetId='+task.targetId,
            headers: {'X-CSRF-Authorization': CSRF_KEY},
            type: 'POST',dataType: 'json',
            data: {
                conditions: [
                    {key: 'targetTable', operator: '=', value: task.targetTable},
                    {key: 'targetId', operator: '=', value: task.targetId},
                    {key: 'isArchived', operator: '<>', value: 1},
                ]
            },
            success: function(response) {
                for(const [id, contact] of Object.entries(response.records ?? {})){
                    if($.isArray(contact.vcard.role) && contact.vcard.role.includes(value)){

                        // Execute Callback
                        if(typeof callback === "function"){
                            callback(task, contact);
                        }

                        // Break the loop
                        break;
                    }
                }
            },
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
