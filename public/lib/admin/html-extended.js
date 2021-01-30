/*
  ___ _  _ _____ _   _ ___ _____ _____   _____    
 |_ _| \| |_   _| | | |_ _|_   _|_ _\ \ / / __| TM
  | || .` | | | | |_| || |  | |  | | \ V /| _|    
 |___|_|\_|_|_|__\___/|___|_|_|_|___| \_/_|___| __
 |   \| __|  \/  |/ _ \ / __| _ \  /_\ / __\ \ / /
 | |) | _|| |\/| | (_) | (__|   / / _ \ (__ \ V / 
 |___/|___|_|  |_|\___/ \___|_|_\/_/ \_\___| |_|  

 © Manuel Valle C. - AromaItaliano SA, Costa Rica

*/

'use strict';

/* globals utils, config, define, app, ajaxify, socket */
define('intuitivedemocracy/admin/html-extended', ['ace/ace', 'ace/ext/language_tools', 'selectize'], function (ace, langTools, selectize) {
	var Widget = {};
	
	Widget.instances = {};
	Widget.templateData = {};

	Widget.init = function(options) {
		// Handle browser native exitFullscreen command ESC
		if (screenfull.isEnabled) {
			screenfull.on('change', event => {
				$(event.target).find('.delete-widget').toggleClass('hidden', screenfull.isFullscreen);
				$(event.target).closest('[data-widget]').find('pre').toggleClass('fullscreen', screenfull.isFullscreen);
				$(event.target).closest('.widget-area.ui-sortable').sortable( screenfull.isFullscreen ? 'disable' : 'enable' );
				Widget.instances[$(event.target).closest('[data-widget]').data('id')].editor.focus();
			});						
		}

		/*
		 *	 Events handlers
		 */

		// Loads respective data acording to selected template (context in which widget is inserted)
		$('#widgets .nav-pills .dropdown-menu a').on('click', function (ev) {
			$('#active-widgets div[data-widget="html-extended"] .panel-body .nav li>a[data-mode="html"]>i').toggleClass('hidden', false);
			const route = $(this).attr('data-template').split('.')[0];
			const key = '1';
			// Retreives data from API route and add as a property in ajaxify.data object
			loadTemplateData(route, key, function(err, data) {
				Widget.templateData = data;
				$('#active-widgets div[data-widget="html-extended"] .panel-body .nav li>a[data-mode="html"]>i').toggleClass('hidden', true);
			});
		})

		$('#widgets .widget-area')
		.on('click', '.expand-widget', event => {
			if (screenfull.isEnabled) {
				screenfull.toggle($(event.target).closest('[data-widget]')[0]);
			}
		})
		.on('click', 'div[data-widget="html-extended"] > .panel-heading', function (evt) {
			if ($(evt.target).hasClass('delete-widget') || $(evt.target).parent('.delete-widget').length) return;

			var route = $(this).parents('[data-template]').data('template').split('.').shift();
			var $panel = $(this).next('.panel-body');
			var $widget = $panel.closest('[data-widget]');
			var $editor = $panel.find('pre.ace-placeholder');
			var $sortable = $widget.closest('.widget-area.ui-sortable');
			var $settings = $widget.find('.settings-wrapper');

			if (Object.keys(Widget.templateData).length) $('#active-widgets div[data-widget="html-extended"] .panel-body .nav li>a[data-mode="html"]>i').toggleClass('hidden', true);

			if (!$panel.hasClass('hidden')) {
				const UUID = utils.generateUUID();
				const elementID = 'ace-editor-'+UUID
				$editor.attr('id', elementID);
				$widget.data('id', elementID);

				Widget.instances[elementID] = {
					editor: ace.edit($editor.get(0)),
					sessions: {},
				};
				var aceEditor = Widget.instances[elementID].editor;
				aceEditor.setTheme('ace/theme/tomorrow');
				aceEditor.setOptions({
					wrap: true,
					enableBasicAutocompletion: true,
					enableSnippets: false,
					enableLiveAutocompletion: true
				});
				var EditSession = require("ace/edit_session").EditSession;
				Widget.instances[elementID].sessions.html = new EditSession($editor.siblings('input[name="template"]').val());
				Widget.instances[elementID].sessions.html.setMode('ace/mode/html');
				Widget.instances[elementID].sessions.less = new EditSession($editor.siblings('input[name="less"]').val());
				Widget.instances[elementID].sessions.less.setMode('ace/mode/less');
				Widget.instances[elementID].sessions.json = new EditSession($editor.siblings('input[name="data"]').val());
				Widget.templateData.slides = validateJsonData(Widget.instances[elementID].sessions.json.getValue());
				$panel.parent().find('.nav a[data-mode="json"]>i').toggleClass('hidden', !Widget.templateData.slides.error);

				Widget.instances[elementID].sessions.json.setMode('ace/mode/json');

				// Ace Editor events handlers
				aceEditor.on('change', function (e, o) {
					app.flags = app.flags || {};
					app.flags._unsaved = true;
					if (o.getSession().$mode.$id.includes('html')) {
						$editor.siblings('input[name="template"]').val(aceEditor.getValue());
					} else if (o.getSession().$mode.$id.includes('json')) {
						Widget.templateData.slides = validateJsonData(aceEditor.getValue());
						$panel.parent().find('.nav a[data-mode="json"]>i').toggleClass('hidden', !Widget.templateData.slides.error);
						$editor.siblings('input[name="data"]').val(aceEditor.getValue());
					} else {
						$editor.siblings('input[name="less"]').val(aceEditor.getValue());
					}
				});
				aceEditor.on('blur', function(e, o) {
					$(e.target).closest('.widget-area.ui-sortable').sortable( "enable" );
				});
				aceEditor.on('focus', function(e, o) {
					$(e.target).closest('.widget-area.ui-sortable').sortable( "disable" );
				});

				$widget.find('script').nextAll().appendTo($settings);
				$settings.find('[name="container"]').addClass('hidden');
				$settings.find('[name="container"]').prev('label').addClass('hidden');
				$widget.find('[name="sliderMode"]').on('change', function(e) {
					var $input = $settings.find('.for-slider');
					$input.find('input').prop('disabled', !Boolean(e.target.value));
					$input.find('label').toggleClass('disabled', !Boolean(e.target.value));
					$input.find('label').toggleClass('disabled', !Boolean(e.target.value));
					$panel.find('.nav a[data-mode="json"]').parent('li').toggleClass('hidden', !Boolean(e.target.value));
				}).trigger('change');

				// Apply Selectize plugin to input elements
				selectizeElements($settings);

				// Adds Ace completer rules
				langTools.addCompleter({ 
					getCompletions: getCompletions
				});

				// Adds Ace commands
				aceEditor.commands.on('afterExec', function(e) {
					var editor = e.editor;
					var hasCompleter = editor.completer && editor.completer.activated;
					if (e.command.name === "insertstring") {
						// Only autocomplete if there's a prefix that can be matched
						if (/[\w{\.]/.test(e.args)) {
							editor.execCommand("startAutocomplete");
						}
					} else if (e.command.name === "backspace") {
						var range = e.editor.getSelectionRange();
						var line = e.editor.session.getLine(range.end.row).substring(0, range.end.column);
						if (/[\w{\.]+[\.\w]$/.test(line)) { //lastChar!=' ') {
							editor.execCommand("startAutocomplete");
						}
					}
				});

				$panel.find('.nav a').off('click').on('click', function(e) {
					$(this).closest('ul').find('li').removeClass('active');
					$(this).closest('li').addClass('active');
					if (this.dataset.mode=='settings') {
						$editor.addClass('hidden');
						$settings.removeClass('hidden');
					} else {
						$editor.removeClass('hidden');
						$settings.addClass('hidden');
						const ID = $(this).closest('ul').next().children('pre.ace-placeholder').attr('id');
						Widget.instances[ID].editor.setSession(Widget.instances[ID].sessions[this.dataset.mode]);
						aceEditor.focus();
					}
				}).first().click();

				$sortable.sortable( "disable" );

				/**
				 * This is a workaround for #160 until ace.js provide a way to define the parentNode of the autocomplete list.
				 * https://github.com/thm-mni-ii/JooMDD/pull/161
				 */

				// Select the node that will be observed for mutations
				var htmlCollection = document.getElementsByTagName("body");
				var body = htmlCollection.item(0);

				// Options for the observer (which mutations to observe)
				var config = { attributes: false, childList: true, subtree: false };

				// Callback function to execute when mutations are observed
				var callback = function(mutationsList, observer) {
					for(var mutation of mutationsList) {
						if (mutation.type == 'childList' && mutation.addedNodes.length > 0) {
							var autocompleteDiv = mutation.addedNodes.item(0);

							if (autocompleteDiv.classList.contains("ace_autocomplete")){
								aceEditor.container.appendChild(aceEditor.completer.popup.container);
							}
						}
					}
				};

				// Create an observer instance linked to the callback function
				var observer = new MutationObserver(callback);

				// Start observing the target node for configured mutations
				observer.observe(body, config);
				/** **/

			} else {
				$panel.find('.nav a').off('click');
				var ID = $panel.find('pre.ace-placeholder').attr('id') 
				Widget.instances[ID].editor.destroy();
				delete Widget.instances[ID];
				$sortable.sortable( "enable" );
			}
		})
		.on('click', 'div[data-widget="html-extended"] .delete-widget', function (evt) {
			// Deletes widget an removes Ace instances
			var $widget = $(this).closest('[data-widget]')
			if ($widget.find('.panel-body').hasClass('hidden')) {
				return;
			} else {
				$widget.find('.panel-body').addClass('hidden');
				var ID = $(this).closest('[data-widget]').find('pre.ace-placeholder').attr('id');
				Widget.instances[ID].editor.destroy();
				delete Widget.instances[ID];
			}
		})
		.on('change', 'div[data-widget="html-extended"] input[name="title"]', function (evt) {
			// Updates widget title "on the fly"
			var $title = $(evt.target).parents('[data-widget]').find('.panel-heading strong');
			var title = ajaxify.data.availableWidgets.filter(function(el) {
				return el.widget=='html-extended'
			}).map(function(el) {
				return el.name
			}).join();
			$title.text(title + ' - ' + this.value);
		})
		.on('sortstop', function(evt, ui ) {
			// Hides widget panel an destroy Ace instances on sorting widgets
			if (ui.item.data('widget')=='html-extended') {
				ui.item.find('.panel-body').addClass('hidden');
				var ID = ui.item.find('pre.ace-placeholder').attr('id');
				if (Widget.instances[ID]) {
					Widget.instances[ID].editor.destroy();
					delete Widget.instances[ID];
				}
			}
		});
	};

	function loadTemplateData(route, key, callback) {
		if (typeof key==='function') {
			callback = key;
			key = '1';
		}
		key = key || '1';
		// Retreives data from API route and add as a property in ajaxify.data object
		loadData(route, function(err, templateData) {
			if (err) { // If an error is returned, try with a user supplied parameter or a default value.
				loadData(route + '/' + key, function(err, templateData) {
					return callback(null, templateData || {});
				})
			} else {
				return callback(null, templateData);
			}
		});
	}

	function loadData (route, callback) {
		var apiXHR = $.ajax({
			url: config.relative_path + '/api/' + route,
			cache: false,
			headers: {
				'X-Return-To': app.previousUrl,
			},
			success: function (data, textStatus, xhr) {
				if (!data) {
					return;
				}

				if (xhr.getResponseHeader('X-Redirect')) {
					return callback({
						data: {
							status: 302,
							responseJSON: data,
						},
						textStatus: 'error',
					});
				}

				data.config = config;
				return callback(null, data);
			},
			error: function (data, textStatus) {
				if (data.status === 0 && textStatus === 'error') {
					data.status = 500;
					data.responseJSON = data.responseJSON || {};
					data.responseJSON.error = '[[error:no-connection]]';
				}
				return callback({
					data: data,
					textStatus: textStatus,
				});
			},
		});
	};

	/**
	 * 	Note:				The expected data, if any, can be one of:
	 *						- an array of objects
	 *						- an object with one the following properties: topics, categories or groups. Which value must be an array of values.
	 *
	 *	@param {object} 	data - { uid: ..., area: ..., templateData: ..., data: ..., req: ..., res: ... }
	 *	@return {object} 	The validated data
	 */
	function validateJsonData(data) {
		let json;

		try {
			json = JSON.parse(data || '[]');
		} catch (error) {
			json = {error: error};
		} finally {
			if (Array.isArray(json)) { // Checks for Array
				return json.filter(function(el) { // Filter only valid elements
					return (el && typeof el==='object');
				});
			} else {
				if (json.error) {
					return json;
				} else if (json.topics && Array.isArray(json.topics)) {
					return {topics: filterArray(json.topics, 'number')};
				} else if (json.categories && Array.isArray(json.categories)) {
					return {categories: filterArray(json.categories, 'number')};
				} else if (json.groups && Array.isArray(json.groups)) {
					return {groups: filterArray(json.groups, 'string')};
				} else {
					return {error : 'Must contain an array of objects or one of the following objects: { "topics": [ .. , .. ] } or { "categories": [ .. , .. ] } or { "groups": [ .. , .. ] }'}; //[]
				}
			};
		}

		function filterArray(obj, type) {
			return obj.filter(function(el) {
				if (el && type==='number') {
					return !isNaN(parseInt(el));
				} else if (el && type==='string') {
					return (typeof el===type);
				} else {
					return false;
				}
			});
		}
	}

	function selectizeElements($obj) {
		var options = '';
		ajaxify.data.categories.forEach(function (el) {
			options += '<option value=' + el.cid + ' data-color="'+el.color+'" data-bgColor="'+el.bgColor+'">' + el.name + '</option>';
		});
		$obj.find('select[name="cid"]:not(.selectized)').append(options);
		// Selectize standard dropdown controls
		$obj.find('select:not(.selectized)').selectize({
			plugins: ['remove_button'],
			delimiter: ',',
			persist: false
		});
	}

	function getCompletions(editor, session, pos, prefix, callback) {
		if (session.getMode().$id!='ace/mode/html') {
			return callback(null, []);
		};

		var line = session.getLine(pos.row);
		if (line.substr(-1)==' ') return callback(null, []);

		var buildDict = function(source, dict) {
			dict = dict || {};
			source = source || {};
			Object.keys(source).forEach(function(el) {
				var type = typeof source[el];
				dict[el] = Array.isArray(source[el]) ? 'array' : type;
			});
			return dict;
		}
		var source = {...Widget.templateData};
		var dict = buildDict(source);

		var properties = line.match(/[\w+\.]+/g);
		if (properties && properties.length) {
			properties = properties.pop().split('.'); // will have a trailing '.'
			properties.some(function(property) {
				if (!property || !source) return; // empty string  
				var type = typeof source[property];
				//dict[property] = type; //if (type) add property 
				if (type!='object') return true;
				type = Array.isArray(source[property]) ? 'array' : type;
				if (source[property]) {
					if (Array.isArray(source[property])) {
						source = source[property][0];
						buildDict(source, dict);
					} else {
						source = source[property];
						dict[property] = typeof source[property];
					}
				}
			});
		}

		let wordList = [];
		if (source) {
			wordList = Object.keys(source).map(function(word) {
				return {
					caption: word,
					value: word + ((dict[word]=='object' || dict[word]=='array') ? '' : '}'),
					score: 1000,
					meta: 'property ' + dict[word]
				};
			})
		}
		callback(null, wordList);
	}

	return Widget;
});