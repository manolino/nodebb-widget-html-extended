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
define('intuitivedemocracy/html-extended', ['bxslider'], function (bxslider) {
	var Widget = {};
	
	Widget.instances = {};

	Widget.init = function(options) {
		// Components initialization
		if (options.isSlider) {
			if (options.maxSlides>1) {
				var w = $('#html-extended-widget-'+options.uuid+'.bxslider').innerWidth();
				var s = options.maxSlides;
				while (w/s < 300) {
					s--;
				};
				options.slideWidth = (w) / s;
			}
			Widget.instances[options.uuid] = $('#html-extended-widget-'+options.uuid+'.bxslider').bxSlider({
				mode: options.sliderMode,
				auto: options.autoStart,
				wrapperClass: 'bx-wrapper '+options.wrapperClass,
				pause: 5000,
				stopAutoOnClick: true,
				infiniteLoop: options.infiniteLoop,
				onSliderLoad: function(i) {
					this.closest('.bx-wrapper')
					.addClass('preventSlideout')
					.css({'max-width': '100vw'})
					.find('a.bx-next, a.bx-prev, a.bx-pager-link').removeAttr('href').css({ 'cursor':  'pointer', 'z-index': 'auto'});
					$(this).removeClass('bxslider-hidden');
				},
				pager: options.enablePager,
				pagerType: 'full',
				controls: options.enableControls,
				captions: true,
				minSlides: 1,
				maxSlides: options.maxSlides,
				slideWidth: options.slideWidth || 0,
				speed: 500
			});
			
			if (options.forceTop) $('#html-extended-widget-'+options.uuid).closest('.bx-wrapper').prependTo('#content');
			
			Widget.instances[options.uuid].redrawSlider();
		} else {
			if (options.forceTop) $('#html-extended-widget-'+options.uuid).prependTo('#content');
		}
	};

	return Widget;
});