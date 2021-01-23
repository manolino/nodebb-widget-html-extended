<ul class="nav nav-pills">
  <li><a href="#" data-mode="settings">Settings</a></li>
  <li><a href="#" data-mode="html">Template<i class="fa fa-spinner fa-spin fa-fw" style="padding-left: 3px;"></i></a></li>
  <li><a href="#" data-mode="less">LESS</a></li>
  <li class="hidden"><a href="#" data-mode="json">Data<i class="fa fa-exclamation-circle fa-fw hidden" aria-hidden="true" style="padding-left: 3px;"></i></a></li>
  <li class="pull-right"><span class="expand-widget"><i class="fa fa-expand active"></i></span></li>
</ul>
<div class="ace-wrapper" data-editor="template">
	<pre class="ace-placeholder mb-0" data-mode="html"></pre>
	<input type="hidden" class="form-control" name="template" value=""/>
	<input type="hidden" class="form-control" name="less" value=""/>
	<input type="hidden" class="form-control" name="data" value=""/>
</div>
<div class="settings-wrapper">
	<label>
		Category:<br>
		<small>Set the categories you want to display this widget on (leave empty for All)</small>
	</label>
    <select name="cid" class="form-control" multiple size="10">
        <!-- BEGIN categories -->
        <option value="{categories.cid}" data-color="{categories.color}" data-bgColor="{categories.bgColor}">{categories.name}</option>
        <!-- END categories -->
    </select>
	<div class="form-group slider-settings">
		<label for="sliderMode">Slider mode</label>
		<select class="form-control selectized" name="sliderMode">
			<option value="">disabled</option>
			<option value="fade">Fade</option>
			<option value="horizontal">Horizontal</option>
			<option value="vertical">Vertical</option>
		</select>
		<div class="row mt-1">
			<div class="col-sm-6 for-slider">
				<label for="maxSlides">Maximum number of visible slides</label>
				<input type="text" class="form-control" name="maxSlides" placeholder="1">
			</div>
			<div class="col-sm-6">
				<label for="wrapperClass">CSS Class</label>
				<input type="text" class="form-control" name="wrapperClass" placeholder="Class name to wrap the slider element">
			</div>
		</div>
		<div class="row mt-1">
			<div class="checkbox for-slider col-sm-6">
				<label for="autoStart">
					<input type="checkbox" name="autoStart" />
					Slider starts playing on load
				</label>
			</div>
			<div class="checkbox for-slider col-sm-6">
				<label for="enablePager">
					<input type="checkbox" name="enablePager" />
					Turn on Paginator for slider
				</label>
			</div>
		</div>
		<div class="row">
			<div class="checkbox for-slider col-sm-6">
				<label for="enableControls">
					<input type="checkbox" name="enableControls" />
					Turn on Controls for slider
				</label>
			</div>
			<div class="checkbox for-slider col-sm-6">
				<label for="infiniteLoop">
					<input type="checkbox" name="infiniteLoop" />
					Enable Infinite Loop
				</label>
			</div>
		</div>
		<div class="row">
			<div class="checkbox col-sm-6">
				<label for="forceTop">
					<input type="checkbox" name="forceTop" />
					Force widget position to top.
				</label>
			</div>
			<div class="checkbox col-sm-6">
			</div>
		</div>
	</div>
</div>
<script>
	'use strict';
	/* globals $*/
	(function() {
		function onLoad() {
			require(['intuitivedemocracy/admin/html-extended'], function(widget) {
				widget.init();
			});
		}

		if (window.jQuery) {
			onLoad();
		} else {
			window.addEventListener('DOMContentLoaded', onLoad);
		}
	})();
</script>