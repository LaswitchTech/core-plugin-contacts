builder.add('widgets','contacts', class extends builder.ComponentClass {

    _init(){
        this._properties = {
            class: {},
            data: {},
            default: {},
            targetTable: null,
            targetId: null,
            interval: 10000,
            autoStart: false,
            callback: {},
        };
        this._vcards = {};
        this._counter = 0;
        this._interval = null;
    }

    _create(){

        // Set Self
        const self = this;

        // Create Component
        this._component = $(document.createElement('div')).attr({
            'id': 'contacts' + this._id,
            'class': 'contacts-feed',
        });
        this._component.id = this._component.attr('id');

        // Set Component Class
        if(this._properties.class.component){
            this._component.addClass(this._properties.class.component);
        }

        // Create a controls container
        this._component.controls = $(document.createElement('div')).addClass('contacts-controls').prependTo(this._component);
        this._component.controls.group = $(document.createElement('div')).addClass('btn-group').appendTo(this._component.controls);
        this._component.controls.group.add = $(document.createElement('button')).attr({
            'class': 'btn btn-success',
            'data-action': 'add',
            'type': 'button',
        }).html('<i class="bi bi-plus-lg"></i>').appendTo(this._component.controls.group);
        this._component.controls.group.grid = $(document.createElement('button')).attr({
            'class': 'btn btn-outline-secondary',
            'data-action': 'grid',
            'type': 'button',
        }).html('<i class="bi bi-grid-3x3-gap"></i>').appendTo(this._component.controls.group);
        this._component.controls.group.list = $(document.createElement('button')).attr({
            'class': 'btn btn-outline-secondary',
            'data-action': 'list',
            'type': 'button',
        }).html('<i class="bi bi-list"></i>').appendTo(this._component.controls.group);

        // Create a search container
        this._component.search = $(document.createElement('input')).attr({
            'class': 'form-control',
            'type': 'search',
            'placeholder': this._builder.Locale.get('Search...'),
        }).prependTo(this._component.controls);
        this._component.search.on('input', function(){
            const search = this.value.toLowerCase();
            self._component.container.children('.col').each(function(){
                const content = $(this).text().toLowerCase();
                if(content.includes(search)){
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });
        });

        // Create a container for the contacts
        this._component.container = $(document.createElement('div')).addClass('contacts-container').appendTo(this._component);
        this._component.container.on('click', '.controls, .controls *', function (e) {
            e.stopPropagation();
        });

        // Load the state
        this.loadState();

        // Add Event Listeners
        this._component.controls.group.add.click(function(){
            self.create();
        });
        this._component.controls.group.grid.click(function(){

            // Set the grid view
            self._component.container.removeClass('list-view').addClass('grid-view');
            self._component.controls.group.grid.addClass('active');
            self._component.controls.group.list.removeClass('active');

            // Save the state
            self.saveState();
        });
        this._component.controls.group.list.click(function(){

            // Set the list view
            self._component.container.removeClass('grid-view').addClass('list-view');
            self._component.controls.group.list.addClass('active');
            self._component.controls.group.grid.removeClass('active');

            // Save the state
            self.saveState();
        });

        // Add existing Contacts
        for(const [key, record] of Object.entries(this._properties.data ?? {})){
            this.add(record);
        }

        // Check if we need to auto start the interval
        if(this._properties.autoStart){

            // Start the interval to check for changes
            setTimeout(function(){
                self.start();
            }, this._properties.interval);
        }
    }

    start(){
        // Set Self
        const self = this;

        // Check if the interval is already set
        if(this._interval){
            console.warn('Interval is already set, stopping the previous one.');
            clearInterval(this._interval);
        }

        // Set the interval to check for changes
        this._interval = setInterval(function(){
            self.load();
        }, this._properties.interval);
    }

    stop(){
        // Check if the interval is set
        if(this._interval){
            clearInterval(this._interval);
            this._interval = null;
        } else {
            console.warn('No interval is currently set.');
        }
    }

    stateKey() {

        // include origin, path and query so /page?a=1 and /page?a=2 don't clash
        const url = location.origin + location.pathname + location.search;
        return `contacts.state::${url}::${this._component.id}`;
    }

    clearState() {

        // Remove persisted state
        localStorage.removeItem(this.stateKey());

        // Reset the view mode
        this._component.container.removeClass('list-view').addClass('grid-view');
    }

    saveState() {

        // Save the current view mode
        const state = {
            view: this._component.container.hasClass('list-view') ? 'list' : 'grid',
        };

        // Persist the state
        localStorage.setItem(this.stateKey(), JSON.stringify(state));
    }

    loadState() {

        // Check for persisted state
        const state = localStorage.getItem(this.stateKey());
        if(state){
            try {
                const parsedState = JSON.parse(state);
                if(parsedState.view === 'list'){
                    // Set the list view
                    this._component.container.removeClass('grid-view').addClass('list-view');
                    this._component.controls.group.list.addClass('active');
                    this._component.controls.group.grid.removeClass('active');
                } else {
                    // Set the grid view
                    this._component.container.removeClass('list-view').addClass('grid-view');
                    this._component.controls.group.grid.addClass('active');
                    this._component.controls.group.list.removeClass('active');
                }
            } catch (e) {
                // If parsing fails, default to grid view
                this._component.container.removeClass('list-view').addClass('grid-view');
                this._component.controls.group.grid.addClass('active');
                this._component.controls.group.list.removeClass('active');
            }
        } else {
            // Default to grid view if no state is found
            this._component.container.removeClass('list-view').addClass('grid-view');
            this._component.controls.group.grid.addClass('active');
            this._component.controls.group.list.removeClass('active');
        }
    }

    load(records = null){

        // Set Self
        const self = this;

        // If records are provided, use them
        if(records !== null && Object.entries(records).length > 0){

            // Add Contacts Posts
            for(const [key, record] of Object.entries(records)){
                self.add(record);
            }
            return this;
        }

        // Retrieve records
        API.endpoint('/contacts/fetchAll').data({
            conditions: [
                {key: 'targetTable', operator: '=', value: this._properties.targetTable},
                {key: 'targetId', operator: '=', value: this._properties.targetId},
                {key: 'isArchived', operator: '<>', value: 1},
            ]
        }).execute(function(response){

            // Add Contacts Posts
            for(const [key, record] of Object.entries(response.records)){
                self.add(record);
            }
        });

        return this;
    }

    add(record, param1 = null, param2 = null){

        // Set Self
        const self = this;

        let options = {};
        let callback = null;

        // Set selector, options, and callback
        [param1, param2].forEach(param => {
            if(param !== null){
                if (typeof param === 'object') {
                    options = param;
                } else if (typeof param === 'function') {
                    callback = param;
                }
            }
        });

        let properties = {
            class: {},
            callback: {},
        };

        // Configure Options
        for(const [key, value] of Object.entries(options)){
            if(typeof properties[key] !== 'undefined'){
                switch(key){
                    case"callback":
                        if(typeof properties[key] !== 'undefined'){
                            for(const [k, v] of Object.entries(value)){
                                if(typeof properties[key][k] !== 'undefined'){
                                    properties[key][k] = v;
                                }
                            }
                        }
                        break;
                    case"class":
                        for(const [section, classes] of Object.entries(value)){
                            if(properties[key][section] != null){
                                properties[key][section] += ' ' + classes;
                            } else {
                                properties[key][section] = classes;
                            }
                        }
                        break;
                    default:
                        properties[key] = value;
                        break;
                }
            }
        }

        // Check if the vcard already exists
        if(this._vcards[record.id ?? (this._counter + 1)]){
            this.edit(record.id, record);
            return this;
        }

        // Increment Post Count
        this._counter++;

        // Set ID
        const count = record.id ?? this._counter;
        const id = this._component.id + 'vcard' + count;

        // Create Column
        let vcard = $(document.createElement('div')).attr({
            'id':id,
            'class':'col',
            'data-type':'contact',
        }).appendTo(this._component.container);
        vcard.id = vcard.attr('id');
        vcard.data = record;

        // Create Card
        vcard.card = $(document.createElement('div')).addClass('card h-100 card-hover').appendTo(vcard);
        vcard.card.body = $(document.createElement('div')).addClass('card-body').appendTo(vcard.card);
        vcard.card.footer = $(document.createElement('div')).addClass('card-footer d-flex gap-2').appendTo(vcard.card);

        // Add vCard information
        vcard.card.body.info = $(document.createElement('div')).addClass('d-flex align-items-center gap-3').appendTo(vcard.card.body);
        vcard.card.body.info.avatar = $(document.createElement('img')).attr({
            'class':'avatar rounded-circle border border-3',
            'src': '/avatar?id=' + record.vcard.id,
            'alt': (record.vcard.name ?? 'Unknown').substring(0,2).toUpperCase(),
        }).appendTo(vcard.card.body.info);
        vcard.card.body.info.container = $(document.createElement('div')).addClass('flex-grow-1').appendTo(vcard.card.body.info);
        vcard.card.body.info.container.name = $(document.createElement('div')).addClass('d-flex align-items-center gap-2 flex-wrap').text(record.vcard.name).appendTo(vcard.card.body.info.container);
        vcard.card.body.info.container.title = $(document.createElement('div')).addClass('small text-secondary').text(record.vcard.title ?? '').appendTo(vcard.card.body.info.container);
        vcard.card.body.badges = $(document.createElement('div')).addClass('mt-2 d-flex flex-wrap gap-2').appendTo(vcard.card.body);
        for(const [key, role] of Object.entries(record.vcard.role ?? {})){
            $(document.createElement('span')).addClass('badge text-bg-light border').text(role).appendTo(vcard.card.body.badges);
        }

        // Add click event to the card
        vcard.card.body.click(function(e){
            if ($(e.target).closest('.controls').length) return;
            self._builder.Widget('vcard',{data: record.vcard.id});
        });

        // Add Body Controls
        vcard.card.body.controls = $(document.createElement('div')).addClass('controls btn-group').appendTo(vcard.card.body.info);
        vcard.card.body.controls.call = $(document.createElement('button')).attr({
            'class':'btn btn-success flex-fill',
            'type': 'button',
            'data-action': 'call',
        }).html('<i class="bi-telephone"></i>').appendTo(vcard.card.body.controls);
        vcard.card.body.controls.call.click(function(){
            self._builder.Widget('followups',{render:false,type:'Call',targetTable:self._properties.targetTable,targetId:self._properties.targetId,default:record.vcard.id}).create();
        });
        vcard.card.body.controls.email = $(document.createElement('a')).attr({
            'class':'btn btn-primary flex-fill',
            'href':'mailto:' + (record.email ?? ''),
        }).html('<i class="bi-envelope"></i>').appendTo(vcard.card.body.controls);
        vcard.card.body.controls.meeting = $(document.createElement('button')).attr({
            'class':'btn btn-purple flex-fill',
            'type': 'button',
            'data-action': 'meeting',
        }).html('<i class="bi-calendar-event"></i>').appendTo(vcard.card.body.controls);
        vcard.card.body.controls.meeting.click(function(){
            self._builder.Widget('followups',{render:false,type:'Meeting',targetTable:self._properties.targetTable,targetId:self._properties.targetId,default:record.vcard.id}).create();
        });
        vcard.card.body.controls.edit = $(document.createElement('button')).attr({
            'class':'btn btn-warning flex-fill',
            'type': 'button',
            'data-action': 'edit',
        }).html('<i class="bi-pencil"></i>').appendTo(vcard.card.body.controls);
        vcard.card.body.controls.edit.click(function(){
            self._builder.Widget('vcard',{mode: 'edit', data: record.vcard.id});
        });
        vcard.card.body.controls.archive = $(document.createElement('button')).attr({
            'class':'btn btn-dark flex-fill',
            'type': 'button',
            'data-action': 'archive',
        }).html('<i class="bi-archive"></i>').appendTo(vcard.card.body.controls);
        vcard.card.body.controls.archive.click(function(){
            self.archive(vcard);
        });

        // Add Footer Controls
        vcard.card.footer.controls = $(document.createElement('div')).addClass('controls btn-group flex-fill').appendTo(vcard.card.footer);
        vcard.card.footer.controls.call = $(document.createElement('button')).attr({
            'class':'btn btn-success btn-sm flex-fill',
            'type': 'button',
            'data-action': 'call',
        }).html('<i class="bi-telephone"></i>').appendTo(vcard.card.footer.controls);
        vcard.card.footer.controls.call.click(function(){
            self._builder.Widget('followups',{render:false,type:'Call',targetTable:self._properties.targetTable,targetId:self._properties.targetId,default:record.vcard.id}).create();
        });
        vcard.card.footer.controls.email = $(document.createElement('a')).attr({
            'class':'btn btn-primary btn-sm flex-fill',
            'href':'mailto:' + (record.email ?? ''),
        }).html('<i class="bi-envelope"></i>').appendTo(vcard.card.footer.controls);
        vcard.card.footer.controls.meeting = $(document.createElement('button')).attr({
            'class':'btn btn-purple btn-sm flex-fill',
            'type': 'button',
            'data-action': 'meeting',
        }).html('<i class="bi-calendar-event"></i>').appendTo(vcard.card.footer.controls);
        vcard.card.footer.controls.meeting.click(function(){
            self._builder.Widget('followups',{render:false,type:'Meeting',targetTable:self._properties.targetTable,targetId:self._properties.targetId,default:record.vcard.id}).create();
        });
        vcard.card.footer.controls.edit = $(document.createElement('button')).attr({
            'class':'btn btn-warning btn-sm flex-fill',
            'type': 'button',
            'data-action': 'edit',
        }).html('<i class="bi-pencil"></i>').appendTo(vcard.card.footer.controls);
        vcard.card.footer.controls.edit.click(function(){
            self._builder.Widget('vcard',{mode: 'edit', data: record.vcard.id});
        });
        vcard.card.footer.controls.archive = $(document.createElement('button')).attr({
            'class':'btn btn-dark btn-sm flex-fill',
            'type': 'button',
            'data-action': 'archive',
        }).html('<i class="bi-archive"></i>').appendTo(vcard.card.footer.controls);
        vcard.card.footer.controls.archive.click(function(){
            self.archive(vcard);
        });

        // Save the vCard in the contacts object
        this._vcards[count] = vcard;

        // return the instance
        return this;
    }

    edit(id, record) {

        // Set Self
        const self = this;

        // Check if the vcard exists
        if(!this._vcards[id]){
            console.warn('VCard with ID ' + id + ' does not exist.');
            return this;
        }

        // Update the vCard data
        const vcard = this._vcards[id];
        vcard.data = record;
        vcard.card.body.info.avatar.attr('src', '/avatar?id=' + record.vcard.id);
        vcard.card.body.info.container.name.text(record.vcard.name);
        vcard.card.body.info.container.title.text(record.vcard.title ?? '');
        vcard.card.body.badges.empty();
        for(const [key, role] of Object.entries(record.vcard.role ?? {})){
            $(document.createElement('span')).addClass('badge text-bg-light border').text(role).appendTo(vcard.card.body.badges);
        }

        // Update the controls links
        vcard.card.body.controls.email.attr('href', 'mailto:' + (record.email ?? ''));
        vcard.card.footer.controls.email.attr('href', 'mailto:' + (record.email ?? ''));

        // return the instance
        return this;
    }

    archive(vcard){

        // Set Self
        const self = this;

        // Create the Modal
        this._builder.Component(
            "modal",
            {
                icon: "archive",
                title: this._builder.Locale.get("Are you sure?"),
                body: this._builder.Locale.get("You are about to archive this contact. Are you sure you want to continue?"),
                color: 'dark',
                callback: {
                    submit: function(element,modal){

                        // Show the modal spinner
                        modal.spinner(true);

                        // AJAX Request - Archive the vcard
                        API.endpoint('/contacts/archive?id='+vcard.data.id).execute(function(response){

                            // Remove the vcard
                            vcard.remove();

                            // Close the modal
                            modal.hide();
                        });
                    },
                },
            },
            function(modal,component){

                // Show the modal
                modal.show();
            },
        );
    }

    create(){

        // Set Self
        const self = this;

        // Create the Modal
        this._builder.Component(
            "modal",
            {
                onEnter: false,
                icon: "person-vcard",
                title: this._builder.Locale.get("Create a Contact"),
                color: 'success',
                size: "xl",
                callback: {
                    load: function(component, modal){
                        return new Promise((resolve, reject) => {
                            try {
                                // Set the parent
                                const parent = component.dialog;

                                // Retrieve the libraries
                                API.endpoint('/library/fetch').execute(function(library){

                                    // Retrieve the vCard's roles
                                    API.endpoint('/categories/fetchAll').data({
                                        conditions: [
                                            {key: 'targetTable', operator: '=', value: 'vcards.role'},
                                        ]
                                    }).execute(function(response){

                                        // Create Role Options
                                        const roles = [];
                                        for(const [key, record] of Object.entries(response.records)){
                                            roles.push({id: record.name, text: builder.Locale.get(record.name)});
                                        }

                                        // Create the Form
                                        self._builder.Utility(
                                            'form',
                                            component.body,
                                            {
                                                class:{
                                                    component: 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3',
                                                },
                                                callback: {
                                                    val: function(values){
                                                        // Set the default values
                                                        values.targetTable = self._properties.targetTable;
                                                        values.targetId = self._properties.targetId;
                                                        return values;
                                                    },
                                                    submit: function(form){

                                                        // Show the modal spinner
                                                        modal.spinner(true);

                                                        // Create the vCard
                                                        API.endpoint('/contacts/create').data(form.val()).execute(function(response){

                                                            // Add the new vCard to the contacts
                                                            self.add(response.record);

                                                            // Hide the modal
                                                            modal.hide();
                                                        });
                                                    },
                                                }
                                            },
                                            function(form,component){

                                                // Add event listener on the modal submit button
                                                parent.content.footer.submit.click(function(e){
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    form.submit();
                                                });

                                                // name
                                                form.add(
                                                    'text',
                                                    {
                                                        name: 'name',
                                                        label: self._builder.Locale.get('Name'),
                                                        placeholder: self._builder.Locale.get('Enter name'),
                                                        required: true,
                                                        class: {
                                                            component: 'col-12',
                                                            label: 'text-bg-primary',
                                                        },
                                                    }
                                                );
                                                // title
                                                form.add(
                                                    'text',
                                                    {
                                                        name: 'title',
                                                        label: self._builder.Locale.get('Title'),
                                                        placeholder: self._builder.Locale.get('Enter title'),
                                                        class: {
                                                            component: 'col-12 col-md-6 col-lg-4',
                                                        },
                                                    }
                                                );
                                                // role
                                                form.add(
                                                    'select2',
                                                    {
                                                        name: 'role',
                                                        label: self._builder.Locale.get('Role'),
                                                        placeholder: self._builder.Locale.get('Select role(s)'),
                                                        class: {
                                                            component: 'col-12 col-md-6 col-lg-8',
                                                        },
                                                        multiple: true,
                                                        options: roles,
                                                        allowClear: true,
                                                    }
                                                );
                                                // address
                                                form.add(
                                                    'text',
                                                    {
                                                        name: 'address',
                                                        label: self._builder.Locale.get('Address'),
                                                        placeholder: self._builder.Locale.get('Enter address'),
                                                        value: self._properties.default.address,
                                                        class: {
                                                            component: 'col-12 col-md-6 col-lg-7',
                                                        },
                                                    }
                                                );
                                                // city
                                                form.add(
                                                    'text',
                                                    {
                                                        name: 'city',
                                                        label: self._builder.Locale.get('City'),
                                                        placeholder: self._builder.Locale.get('Enter city'),
                                                        value: self._properties.default.city,
                                                        class: {
                                                            component: 'col-12 col-md-6 col-lg-5',
                                                        },
                                                    }
                                                );
                                                // country
                                                form.add(
                                                    'select2',
                                                    {
                                                        name: 'country',
                                                        label: self._builder.Locale.get('Country'),
                                                        placeholder: self._builder.Locale.get('Select country'),
                                                        value: self._properties.default.country.code,
                                                        class: {
                                                            component: 'col-12 col-md-6 col-lg-4',
                                                        },
                                                        options: library.options.countries,
                                                        callback: {
                                                            onChange: function(input, component){

                                                                // Check if the state input exists
                                                                if(!form._inputs.state){
                                                                    return;
                                                                }

                                                                // Clear the state select2 options
                                                                form._inputs.state.delete();

                                                                // Add the new options based on the selected country
                                                                for(const [key, option] of Object.entries(library.options.states[input.val()] || [])){
                                                                    form._inputs.state.add(option.id, option.text);
                                                                }

                                                                // Reset the state value
                                                                form._inputs.state.reset();
                                                            }
                                                        },
                                                    }
                                                );
                                                // state
                                                form.add(
                                                    'select2',
                                                    {
                                                        name: 'state',
                                                        label: self._builder.Locale.get('State'),
                                                        placeholder: self._builder.Locale.get('Select state'),
                                                        value: self._properties.default.state.code,
                                                        class: {
                                                            component: 'col-12 col-md-6 col-lg-4',
                                                        },
                                                        options: library.options.states[self._properties.default.country.code] || [],
                                                    }
                                                );
                                                // zipcode
                                                form.add(
                                                    'zipcode',
                                                    {
                                                        name: 'zipcode',
                                                        label: self._builder.Locale.get('Zipcode'),
                                                        placeholder: self._builder.Locale.get('Enter zipcode'),
                                                        value: self._properties.default.zipcode,
                                                        class: {
                                                            component: 'col-12 col-md-6 col-lg-4',
                                                        },
                                                    }
                                                );
                                                // email
                                                form.add(
                                                    'email',
                                                    {
                                                        name: 'email',
                                                        label: self._builder.Locale.get('Email'),
                                                        placeholder: self._builder.Locale.get('Enter email'),
                                                        class: {
                                                            component: 'col-12 col-md-6 col-lg-8',
                                                            label: 'text-bg-primary',
                                                        },
                                                    }
                                                );
                                                // fax
                                                form.add(
                                                    'phone',
                                                    {
                                                        name: 'fax',
                                                        label: self._builder.Locale.get('Fax'),
                                                        placeholder: self._builder.Locale.get('Enter fax'),
                                                        value: self._properties.default.fax,
                                                        class: {
                                                            component: 'col-12 col-md-6 col-lg-4',
                                                        },
                                                    }
                                                );
                                                // phone
                                                form.add(
                                                    'phoneExt',
                                                    {
                                                        name: 'phone',
                                                        label: self._builder.Locale.get('Phone'),
                                                        placeholder: self._builder.Locale.get('Enter phone'),
                                                        value: self._properties.default.phone,
                                                        class: {
                                                            component: 'col-12 col-md-6 col-lg-4',
                                                        },
                                                    }
                                                );
                                                // mobile
                                                form.add(
                                                    'phone',
                                                    {
                                                        name: 'mobile',
                                                        label: self._builder.Locale.get('Mobile'),
                                                        placeholder: self._builder.Locale.get('Enter mobile'),
                                                        value: self._properties.default.mobile,
                                                        class: {
                                                            component: 'col-12 col-md-6 col-lg-4',
                                                        },
                                                    }
                                                );
                                                // tollfree
                                                form.add(
                                                    'phoneInt',
                                                    {
                                                        name: 'tollfree',
                                                        label: self._builder.Locale.get('Tollfree'),
                                                        placeholder: self._builder.Locale.get('Enter tollfree'),
                                                        value: self._properties.default.tollfree,
                                                        class: {
                                                            component: 'col-12 col-md-6 col-lg-4',
                                                        },
                                                    }
                                                );
                                                // locale
                                                form.add(
                                                    'select2',
                                                    {
                                                        name: 'locale',
                                                        label: self._builder.Locale.get('Locale'),
                                                        placeholder: self._builder.Locale.get('Select locale'),
                                                        value: self._properties.default.locale,
                                                        class: {
                                                            component: 'col-12',
                                                        },
                                                        options: library.options.locales,
                                                    }
                                                );

                                                // Resolve the promise
                                                resolve();
                                            },
                                        );
                                    },function(xhr, status, error){
                                        modal.hide();
                                        reject(error);
                                    });
                                },function(xhr, status, error){
                                    modal.hide();
                                    reject(error);
                                });
                            } catch(e) { reject(e); }
                        });
                    },
                },
            },
            function(modal,component){

                // Show the modal
                modal.show();
            },
        );
    }
});
