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
// NodeBB core
const db = require.main.require('./src/database'),
	user = require.main.require('./src/user'),
	groups = require.main.require('./src/groups'),
	topics = require.main.require('./src/topics'),
	categories = require.main.require('./src/categories'),
	privileges = require.main.require('./src/privileges'),
	translator = require.main.require('./src/translator'),
	utils = require.main.require('./src/utils'),
	meta = require.main.require('./src/meta');

// NPM modules
const winston = require.main.require('winston'),
	benchpress = require.main.require('benchpressjs'),
	validator = require.main.require('validator'),
	nconf = require.main.require('nconf'),
	less = require.main.require('less'),
	path = require('path'),
	fs = require('fs');

let app;

const Widget = module.exports;

Widget.init = async function (params) {
	app = params.app;
};

Widget.activate = async function (params) {
	const [draftsJSON, drafts] = await Promise.all([
		fs.promises.readFile(path.join(__dirname, '/data/drafts.json'), 'utf8'),
		db.getObjectField('widgets:global', 'drafts'),
	]);

	let json;

	try {
		json = JSON.parse(drafts || '[]');
		
	} catch (error) {
		json = {error: error};
	} finally {
		if (Array.isArray(json)) { // Checks for Array
			json = json.filter(function(el) { // Filter only valid elements
				return (el && el.widget==='html-extended');
			});
		} else if (!json.error) {
			json = [];
		}
		if (!json.length && !json.error && draftsJSON) {
			await db.setObjectField('widgets:global', 'drafts', draftsJSON);
			winston.info('[nodebb-widget-html-extended] drafts loaded');
		} else if (json.length>0) {
			winston.warn('[nodebb-widget-html-extended] drafts already present');
		} else if (json.error || !draftsJSON) {
			winston.error('[nodebb-widget-html-extended] invalid draft.json: %s', json.error);
		}
	}
};

Widget.defineWidgets = async function (widgets) {
	const widgetData = [
		{
			widget: 'html-extended',
			name: 'HTML Extended',
			description: 'Enhanced HTML block with slider',
			content: 'admin/html-extended',
		},
	];

	await Promise.all(widgetData.map(async function (widget) {
		widget.content = await app.renderAsync(widget.content, {});
	}));

	widgets = widgets.concat(widgetData);

	return widgets;
};

/**
 *	Hook handler:		filter:middleware.render
 *	Trigged in:			src/middleware/render.js
 * 	Note:				Builds Categories list and adds it to template data. Only for widgets panel route.
 *
 *	@param {object} 	data - { req: ..., res: ..., templateData: ... }
 *	@return {object}	The modified data
 */
Widget.renderACPTemplate = async function (data) {
	if (data.templateData.template['admin/extend/widgets']) {
		data.templateData.categories = await categories.buildForSelectAll();
	}
	return data;
}

/**
 *	Hook handler:		filter:widget.render:html-extended
 *	Trigged in:			src/widgets/index.js
 * 	Note:				Renders HTML template widget using user provided data
 *
 *	@param {object} 	widget - { uid: ..., area: ..., templateData: ..., data: ..., req: ..., res: ... }
 *	@return {object} 	The extended settings
 */
Widget.renderHtmlExtended = async function (widget) {
	if (!isVisibleInCategory(widget)) {
		return null;
	}

	let css;
	let jsonData;
	let tpl = widget.data.template || '';
	let uuid = utils.generateUUID();

	widget.data.less = widget.data.less || '';

	// Compoles LESS data
	less.render(widget.data.less, { compress: true })
		.then(function(output) {
			css = output.css;
		},
		function(error) {
			winston.error('[nodebb-widget-html-extended] %s', error);
		});

	// Validates data and Retrieves it
	if (widget.data.sliderMode) {
		jsonData = validateJsonData(widget.data.data);

		if (jsonData.error) {
			winston.error('[nodebb-widget-html-extended] %s', jsonData.error);
			jsonData = [];
		} else if (jsonData.topics) {
			jsonData = await getTopicsData(jsonData.topics, widget.uid);
		} else if (jsonData.categories) {
			jsonData = await getCategories(jsonData.categories, widget.uid);
		} else if (jsonData.groups) {
			jsonData = await getGroupsData(jsonData.groups);
		}
	}
	// Sets BX Slider settings
	const options = {
		isSlider: Boolean(widget.data.sliderMode) && jsonData,
		sliderMode: widget.data.sliderMode,
		wrapperClass: String(widget.data.wrapperClass),
		autoStart: Boolean(widget.data.autoStart),
		enablePager: Boolean(widget.data.enablePager),
		enableControls: Boolean(widget.data.enableControls),
		infiniteLoop: Boolean(widget.data.infiniteLoop),
		uuid: uuid,
		minSlides: 1,
		maxSlides: parseInt(widget.data.maxSlides) || 1,
		forceTop: Boolean(widget.data.forceTop),
	};

	// Wraps user defined template with a cycle if slider mode is defined
	if (options.isSlider) {
		tpl = '{{{ each slides }}}<div>'+tpl+'</div>{{{ end }}}';
	}

	//Compile user defined template
	let html = await benchpress.compileRender(tpl, {...widget.templateData, slides: jsonData})
		.then(function(html) {
			return html;
		},
		function(error) {
			// Returs the error, 
			return '<div id="html-extended-widget-'+options.uuid+'" class="html-extended-widget text-center"><h4>Widget Error! <strong>'+utils.escapeHTML(error)+'</strong></h4></div>';
			
	});

	// Finally passes parsed html to the widget template with other options
	widget.html = await app.renderAsync('widgets/html-extended', {
		html: html,
		css: css,
		options: JSON.stringify(options),
		isSlider: options.isSlider,
		uuid: options.uuid,
		wrapperClass: options.wrapperClass,
	});
	
	return widget;
}

/**
 * 	Note:				The expected data, if any, can be one of:
 *						- an array of objects
 *						- an object with one the following properties: 'topics', 'categories' or 'group's. Which value must be an array of values.
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
				return [];
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

async function getTopicsData(tids, uid) {
	const [topicsData, postsData] = await Promise.all([
		topics.getTopicsByTids(tids, uid),
		topics.getMainPosts(tids, uid),
	]);

	const topicsMap = topicsData.map(function(el, i) {
		el.isValid = el.isValid || true;
		return {
			...el,
			mainPost: postsData[i]
		};
	}).filter(function(el) {
		return el.isValid;
	});

	return topicsMap;
}

async function getCategoriesData(cids, uid) {
	const [allowed, watchState, categoryData, isAdmin] = await Promise.all([
		privileges.categories.isUserAllowedTo('topics:read', cids, uid),
		categories.getWatchState(cids, uid),
		categories.getCategoriesData(cids),
		user.isAdministrator(uid),
	]);
	return categoryData;
}

async function getGroupsData(groupsNames) {
	const groupsMap = {};
	const groupsData = await groups.getGroupsData(groupsNames);
	groupsData.forEach(function (group) {
		if (group && group.userTitleEnabled && !group.hidden) {
			groupsMap[group.name] = {
				name: group.name,
				slug: group.slug,
				labelColor: group.labelColor,
				textColor: group.textColor,
				icon: group.icon,
				userTitle: group.userTitle,
			};
		}
	});
	return groupsMap;
}

function getCidsArray(widget) {
	const cids = widget.data.cid || '';
	return cids.split(',').map(c => parseInt(c, 10)).filter(Boolean);
}

function isVisibleInCategory(widget) {
	const cids = getCidsArray(widget);
	return !(cids.length && (widget.templateData.template.category || widget.templateData.template.topic) && !cids.includes(parseInt(widget.templateData.cid, 10)));
}
