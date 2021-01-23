<div id="html-extended-widget-{uuid}" class="html-extended-widget {wrapperClass} <!-- IF isSlider --> bxslider bxslider-hidden<!-- END -->">
{html}
</div>
<script>
	'use strict';
	/* globals $*/
	(function() {
		function onLoad() {
			require(['intuitivedemocracy/html-extended'], function(widget) {
				// Appends custom CSS styles
				var style = document.createElement('style');
				style.type = 'text/css';
				style.innerHTML = '{css}';
				document.head.append(style); 
				// Initializes widget components
				widget.init({options});
			});
		}

		if (window.jQuery) {
			onLoad();
		} else {
			window.addEventListener('load', onLoad);
		}
	})();
</script>
