/*global jQuery, Handlebars, Router */
jQuery(function ($) {
	'use strict';

	Handlebars.registerHelper('eq', function (a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;

	// UTIL Method/Function extraction
	function uuid() {
		/*jshint bitwise:false */
		var i, random;
		var uuid = '';

		for (i = 0; i < 32; i++) {
			random = Math.random() * 16 | 0;
			if (i === 8 || i === 12 || i === 16 || i === 20) {
				uuid += '-';
			}
			uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
		}

		return uuid;
	}

	function pluralize(count, word) {
		return count === 1 ? word : word + 's';
	}

	function store(namespace, data) {
		if (arguments.length > 1) {
			return localStorage.setItem(namespace, JSON.stringify(data));
		} else {
			var store = localStorage.getItem(namespace);
			return (store && JSON.parse(store)) || [];
		}
	}

	// APP Method/Function extraction

	function init() {
		window.todos = store('todos-jquery')
		window.todoTemplate = Handlebars.compile($('#todo-template').html())
		window.footerTemplate =Handlebars.compile($('#footer-template').html())
		window.filter = '/all'
		bindEvents();
		new Router({
			'/:filter': function (filterParam) {
				filter = filterParam;
				render();
			}.bind(this)
		}).init(filter);
	}

	function bindEvents() {
		$('#new-todo').on('keyup', create.bind(this));
		$('#toggle-all').on('change', toggleAll.bind(this));
		$('#footer').on('click', '#clear-completed', destroyCompleted.bind(this));
		$('#todo-list')
			.on('change', '.toggle', toggle.bind(this))
			.on('dblclick', 'label', edit.bind(this))
			.on('keyup', '.edit', editKeyup.bind(this))
			.on('focusout', '.edit', update.bind(this))
			.on('click', '.destroy', destroy.bind(this));
	}

	function render() {
		var localTodos = getFilteredTodos();
		$('#todo-list').html(todoTemplate(localTodos));
		$('#main').toggle(localTodos.length > 0);
		$('#toggle-all').prop('checked', getActiveTodos().length === 0);
		renderFooter();
		$('#new-todo').focus();
		store('todos-jquery', localTodos);
	}

	function update(e) {
		console.log('update')
		var el = e.target;
		var $el = $(el);
		var val = $el.val().trim();

		if (!val) {
			this.destroy(e);
			return;
		}

		if ($el.data('abort')) {
			$el.data('abort', false);
		} else {
			todos[indexFromEl(el)].title = val;
		}

		render();
	}

	function editKeyup(e) {
		console.log('edit key up')
		if (e.which === ENTER_KEY) {
			e.target.blur();
		}

		if (e.which === ESCAPE_KEY) {
			$(e.target).data('abort', true).blur();
		}
	}

	function edit(e) {
		var $input = $(e.target).closest('li').addClass('editing').find('.edit');
		$input.val($input.val()).focus();
	}

	// accepts an element from inside the `.item` div and
	// returns the corresponding index in the `todos` array
	function indexFromEl(el) {
		var id = $(el).closest('li').data('id');
		var i = todos.length;

		while (i--) {
			if (todos[i].id === id) {
				return i;
			}
		}
	}

	function create(e) {
		var $input = $(e.target);
		var val = $input.val().trim();

		if (e.which !== ENTER_KEY || !val) {
			return;
		}

		todos.push({
			id: uuid(),
			title: val,
			completed: false
		});

		$input.val('');

		render();
	}

	function destroyCompleted() {
		todos = getActiveTodos();
		filter = 'all';
		render();
	}

	function getFilteredTodos() {
		if (filter === 'active') {
			return getActiveTodos();
		}

		if (filter === 'completed') {
			return getCompletedTodos();
		}

		return todos;
	}

	function getCompletedTodos() {
		return todos.filter(function (todo) {
			return todo.completed;
		});
	}

	function getActiveTodos() {
		return todos.filter(function (todo) {
			return !todo.completed;
		});
	}

	function toggleAll(e) {
		var isChecked = $(e.target).prop('checked');

		todos.forEach(function (todo) {
			todo.completed = isChecked;
		});

		render();
	}

	function renderFooter() {
		var todoCount = todos.length;
		var activeTodoCount = getActiveTodos().length;
		var template = footerTemplate({
			activeTodoCount: activeTodoCount,
			activeTodoWord: pluralize(activeTodoCount, 'item'),
			completedTodos: todoCount - activeTodoCount,
			filter: filter
		});

		$('#footer').toggle(todoCount > 0).html(template);
	}

	function toggle(e) {
		var i = indexFromEl(e.target);
		todos[i].completed = !todos[i].completed;
		render();
	}

	function destroy(e) {
		todos.splice(indexFromEl(e.target), 1)
		render()
	}

	init();
});