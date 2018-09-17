
var domain = {

    Group: function (name) {

        /* Private Properties */

        /* Public Properties */
        this.id = shortid.generate();
        this.name = name || '';
        this.value = this.name.toLowerCase().replace(/\s/ig, '_');
        this.description = '';

        /* Public Methods */


    },

    Section: function (title, description, cards) {

        /* Private Properties */

        /* Public Properties */
        this.id = shortid.generate();
        this.title = title || '';
        this.description = description || '';
        this.cards = cards || [];
        this.dependencies = null;
        this.active = true;

        /* Public Methods */
    },

    Card: function (title, body, questions) {

        /* Private Properties */

        /* Public Properties */
        this.id = shortid.generate();
        this.title = title || '';
        this.body = body || '';
        this.dependencies = null;
        this.subSectionTemplate = null;
        this.subSections = [];
        this.questions = questions || [];
        this.active = true;

        /* Public Methods */

    },

    Question: function (type, text, validators) {

        /* Private Properties */

        /* Public Properties */
        this.id = shortid.generate();
        this.type = type || null;
        this.text = text || '';
        this.dependencies = null;
        this.validators = validators || [];
        this.answer = null;
        this.active = true;
        this.fieldName = '';
        this.sortable = true;
        this.searchable = true;
        this.exportable = true;

        /* Public Methods */


    },

    Dependency: function (questionId, value, operator) {

        this.questionId = questionId || null;
        this.value = value || '';
        this.operator = operator || 'eq'; //eq|neq|lte|gte|gt|lt|range
    },

    Validator: function (type) {
        this.type = type || '';
    }
};