/* jslint undef: true */
/* global window, document, $ */


(function(window, document, undefined) {
	
	'use strict';
	
	var templates = {};
	var active    = false;
	var tags      = [];
	var newTags   = [];
	var id = 0;
	var enableTagging = false;
	
	
	// Utility functions
	function compileTemplates() {
		var html = $('#template-comment').html();
		var template = Handlebars.compile(html);
		templates.comment = template;
		html = $('#template-marker').html();
		template = Handlebars.compile(html);
		templates.marker = template;
		html = $('#template-form').html();
		template = Handlebars.compile(html);
		templates.form = template;
		html = $('#template-comment-new').html();
		template = Handlebars.compile(html);
		templates.commentNew = template;
	}
	
	function guid() {
		var res = id + '-id';
		id++;
		return res;
	}
	
	function setPixels(x, y) {
		x = x.slice(0, - 2);
		y = y.slice(0, - 2);
		x = parseInt(x);
		y = parseInt(y);
		return { x : x, y : y };
	}
	
	function getTag(arr, tagId) {
		var result = false;
		arr.map(function(data) {
			if(data.id === tagId) {
				result = data;
			}
		});
		return result;
	}
	
	function normalizeData(formData) {
		var arr = [];
		newTags.map(function(data) {
			arr.push({
				x : data.x,
				y : data.y,
				name : formData.name,
				email : formData.email,
				comment : data.comment
			});
		});
		return arr;
	}
	
	function setDimensions() {
		var el = document.getElementsByClassName('image')[0];
		var w = el.clientWidth;
		var h = el.clientHeight;
		var ratio;
		//el.style.height = '400px';
		var h2 = $('.image-container').height();
		var w2 = $('.image-container').width();
		console.log(h, h2);
		if(w > w2 || h > h2) {
			if(w > w2) {
				ratio = w - w2;
				w = w - ratio;
				h = h - ratio;
			} else if(h > h2) {
				ratio = h - h2;
				h = h - ratio;
				w = w - ratio;
			} else {
				if((h - h2) > (w - w2)) {
					ratio = h - h2;
				} else {
					ratio = w - w2;
				}
				h = h - ratio;
				w = w - ratio;
			}
			el.style.width = w + 'px';
			el.style.height = h + 'px';
		}
		$('.image-container').append('<div class="image-outer"></div>');
		$('.image').appendTo('.image-outer');
	}
	
	function createTag(data) {
		data.id = guid();
		console.log(data);
		newTags.push(data);
		var obj = setPixels(data.x, data.y);
		data.modx = (obj.x - 8) + 'px';
		data.mody = (obj.y - 8) + 'px';
		data.new = true;
		$('.image-outer').append(templates.marker(data));
	}
	
	function onClick(e) {
		if(!active && enableTagging) {
			active = true;
			var offset = $(this).offset();
    	var x = e.pageX - offset.left;
    	var y = e.pageY - offset.top;
			var data = {
				x : Math.round(x) + 'px',
				y : Math.round(y) + 'px'
			};
			var str = templates.comment(data);
			$('.image-outer').append(str);
			$('.tag-input').focus();
		}
	}
	
	function onKeypress(e) {
		if(e.keyCode === 13) {
			var val = $(this).val();
			if(val.length > 0) {
				var x = $(this).data('x');
				var y = $(this).data('y');
				var data = {
					comment : val,
					x   : x,
					y   : y
				};
				$('.comment').remove();
				createTag(data);
				active = false;
			}
		}
	}
	
	function onSubmit(e) {
		var data = utils.getFormData($(this));
		e.preventDefault();
		if(data.name && data.email) {
			
			var arr = normalizeData(data);
			console.log(arr);
			var obj = {
				url : $('.image-container').data('raw'),
				data : {
					tags : arr
				}
			};
			utils.req(obj, function(code, result) {
				if(code === 201) {
					enableTagging = false;
					toggleForm();
				}
			});
			
		} else {
			$('#main-form input').addClass('error');
		}
		return false;
	}
	
	function onClickTagButton() {
		enableTagging = true;
		toggleForm();
	}
	
	function toggleForm() {
		if(enableTagging) {
			console.log('tag');
			$('#tag-button').addClass('hidden');
			$('#main-form').removeClass('hidden');
			$('.site-header').addClass('inactive');
			$('.image').addClass('active');
		} else {
			$('#tag-button').removeClass('hidden');
			$('#main-form').addClass('hidden');
			$('.site-header').removeClass('inactive');
			$('.image').removeClass('active');
		}
	}
	
	function onClickMarker() {
		var isNew = $(this).data('new');
		var active = $(this).data('active');
		if(!active) {
			if(isNew) {
				var id = $(this).data('id');
				var tag = getTag(newTags, id);
				var data = {
					comment : tag.comment,
					name : tag.name,
					created : tag.created || new Date(),
				};
				data.created = new moment(data.created).fromNow();
				$(this).addClass('hover');
				$(this).data('active', true);
				var gravatar = utils.getGravatar(tag.comment);
				$(this).css({'background-image':'url(' + gravatar + ')'});
				var str = templates.commentNew(data);
				$(this).append(str);
			} else {
				var id = $(this).data('id');
				var tag = getTag(tags, id);
				var data = {
					comment : tag.comment,
					name : tag.name,
					created : tag.created || new Date()
				};
				data.created = new moment(data.created).fromNow();
				$(this).addClass('hover');
				$(this).data('active', true);
				console.log(tag);
				var gravatar = utils.getGravatar(tag.email);
				
				$(this).css({'background-image':'url(' + gravatar + ')'});
				var str = templates.commentNew(data);
				$(this).append(str);
			}
		} else {
			$(this).removeClass('hover');
			$(this).css({'background-image':'none'});
			$(this).empty();
			$(this).data('active', false);
		}
	}
	
	function attachEventHandlers() {
		$(document).on('click', '.image', onClick);
		$(document).on('keypress', '.tag-input', onKeypress);
		$(document).on('submit', '#main-form', onSubmit);
		$(document).on('click', '#tag-button', onClickTagButton);
		$(document).on('click', '.marker', onClickMarker);
		//Mousetrap.bind(['command+enter', 'ctrl+enter'], saveComment);
	}
	
	function setTags(data) {
		tags = data.tags;
		var str = '';
		tags = tags.map(function(data) {
			data.id = guid();
			var obj = setPixels(data.x, data.y);
			obj = {
				modx : (obj.x - 8) + 'px',
				mody : (obj.y - 8) + 'px',
				id   : data.id
			};
			str += templates.marker(obj);
			return data;
		});
		$('.image-outer').append(str);
		setTimeout(function() {
			pulse();
		}, 50);
	}
	
	function pulse() {
		$('.marker').addClass('pulse');
		setTimeout(function() {
			$('.marker').removeClass('pulse');
		}, 200);
	}
	
	function loadTags() {
		var obj = {
			url : $('.image-container').data('raw') + '/tags',
			data : {}
		};
		utils.req(obj, function(code, result) {
			setTags(result);
		});
	}
	
	function loadImage() {
		utils.activateSpinner();
		var url = $('.image-container').data('image');
		$('<img src="'+ url +'" class="image">').load(function() {
      $(this).appendTo('.image-container');
			setDimensions();
			attachEventHandlers();
			utils.deactivateSpinner();
			loadTags();
    });
	}
	
	// Bootstrapping
	function init() {
		compileTemplates();
		loadImage();
	}
	
	$(document).ready(init);
	
})(window, document);