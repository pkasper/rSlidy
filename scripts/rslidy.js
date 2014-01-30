var copperhead = function()
{
	var self;
	var state = {slide_number:0,step_number:0};
	var locked = false;
	
	var mobile = false;
	var animated = false;
	
	var slides = new Array();
	var frame;
	var status;
	var slide_in;
	
	var title = document.title;
	var keycodes = {up:[38,87],down:[40,83],left:[37,65],right:[39,68],lock:[0,17],nav:[0,27]};
	
	var scripts = new Array("hand.js");
	var stylesheets = new Array('css/rslidy.css');
//nav functions
	var slide_jump = function(slide_number)
	{
		if(locked)
		{
			return;
		}
		
		if((slide_number<1) || (slide_number > slides.length+1))
		{
			return;
		}
		
		state.slide_number = slide_number-1;
		for(var i = 0; i<slides.length; ++i)
		{
			slides[i].slide.style.left = '-' + state.slide_number + '00%';
		}
		
		rcon.broadcast("slide_jump;"+(state.slide_number+1));
		update_status();
	}
	
	var step_jump = function(step_number)
	{
		for(var i = 0; i<slides[state.slide_number].increment_objects.length; ++i)
		{
			slides[state.slide_number].increment_objects[i].classList.add('incremental');
			if(i<(step_number-1))
			{
				slides[state.slide_number].increment_objects[i].classList.remove('incremental');
			}
		}
		slides[state.slide_number].step_index = parseInt(step_number)-1;
		update_status();
	}

	var slide_next = function()
	{
		if(locked)
		{
			return;
		}
		
		if(!(state.slide_number == slides.length - 1))
		{
			state.slide_number++;
		}

		
		for(var i = 0; i<slides.length; ++i)
		{
			slides[i].slide.style.left = '-' + state.slide_number + '00%';
		}
		rcon.broadcast("slide_next");
		update_status();
	}
	
	var slide_prev = function()
	{
		if(locked)
		{
			return;
		}
		
		if(!(state.slide_number == 0))
		{
			state.slide_number--;
		}
		
		for(var i = 0; i<slides.length; ++i)
		{
			slides[i].slide.style.left = '-' + state.slide_number + '00%';
		}
		rcon.broadcast("slide_prev");
		update_status();
	}
	
	var step_next = function()
	{
		if(locked)
		{
			return;
		}
		if(slides[state.slide_number].step_index > slides[state.slide_number].increment_objects.length-1)
		{
			slide_next();
			return;
		}
		
		slides[state.slide_number].increment_objects[slides[state.slide_number].step_index].classList.remove('incremental');
		rcon.broadcast("step_next");
		slides[state.slide_number].step_index++;
		update_status();
	}
	
	var step_prev = function()
	{
		if(locked)
		{
			return;
		}
		if(slides[state.slide_number].step_index == 0)
		{
			slide_prev();
			return;
		}
		slides[state.slide_number].step_index--;
		slides[state.slide_number].increment_objects[slides[state.slide_number].step_index].classList.add('incremental');
		
		rcon.broadcast("step_prev");
		update_status();
	}
	
	var slide_in_toggle = function()
	{
		slide_in.frame.classList.toggle('cprhd_toc_frame');
		slide_in.frame.classList.toggle('cprhd_toc_frame_open');
		slide_in.button.classList.toggle('cprhd_toc_button');
		slide_in.button.classList.toggle('cprhd_toc_button_open');
		slide_in.menu.classList.toggle('cprhd_toc_button_menu');
		slide_in.menu.classList.toggle('cprhd_toc_button_menu_open');
		frame.classList.toggle('cprhd_frame_shrinked');
	}
	
	function handle_event(evt)
	{
		if(evt.which == 3)
		{
			return;
		}
		switch(evt.type)
		{
			//-hammer defs
			case 'swipeleft':
			{
				slide_next();
				break;
			}
			case 'swiperight':
			{
				slide_prev();
				break;
			}
			case 'tap':
			{
				if(evt.gesture.center.pageX > frame.offsetWidth/2) 
				{
                	step_next();
                }
                else 
				{
            		step_prev();
            	}
                break;      
			}
			
//----- HAND.js
			case 'pointerdown':
			{
				pointer.down(evt);
				break;
			}
			case 'pointerup':
			{
				pointer.up(evt);
				break;
			}
			case 'pointermove':
			{
				pointer.move(evt);
				break;
			}
			default:
			{
				//alert(evt.type);
			}
		}
	}
	
	function handle_keypress(evt)
	{

		var key_code = evt.keyCode;
//		alert(key_code);

		for(i in keycodes.left)
		{
			if(key_code == keycodes.left[i])
			{
				slide_prev();
				return;
			}
		}
		
		for(i in keycodes.right)
		{
			if(key_code == keycodes.right[i])
			{
				slide_next();
				return;
			}
		}
		
		for(i in keycodes.up)
		{
			if(key_code == keycodes.up[i])
			{
				step_prev();
				return;
			}
		}
		
		for(i in keycodes.down)
		{
			if(key_code == keycodes.down[i])
			{
				step_next();
				return;
			}
		}
		for(i in keycodes.lock)
		{
			if(key_code == keycodes.lock[i])
			{
				if(locked)
				{
					locked = false;
					set_message("UNLOCKED");
				}
				else
				{
					locked = true;
					set_message("LOCKED");
				}
				return;
			}
		}
		
		for(i in keycodes.nav)
		{
			if(key_code == keycodes.nav[i])
			{
				slide_in_toggle();
				return;
			}
		}
	}
	
	var slide = function(param_slide)
	{
		this.index = slides.length;
		this.step_index = 0;
		var slide_frame = document.createElement('div');
		slide_frame.appendChild(param_slide.cloneNode(true));
		this.slide = slide_frame;
		this.increment_objects = new Array();
		
		var get_increment_objects = function(root_node,slide)
		{
			for(var i = 0; i < root_node.childNodes.length; ++i)
			{
				var current_node = root_node.childNodes[i];
				if(current_node.nodeType == 1)
				{
					if(current_node.classList.contains('incremental'))
					{
						slide.increment_objects.push(current_node);
					}
					get_increment_objects(current_node,slide);
				}
			}
		}
		
		get_increment_objects(this.slide,this);
		slides.push(this);
	}
	
	var startup = function()
	{
		self = this;
		setTimeout(function(){connect();},1000);
		detect_mobile();
		extract_slides();
		generate_slideshow();
		extract_meta();
		
		load_css();
		load_js();

		
		generate_toc();
		add_event_listeners();
		load_from_url();
		update_status();
	}
	
	var extract_meta = function()
	{
		var possible_tags = document.getElementsByTagName('meta');
		for(var i = 0; i<possible_tags.length; ++i)
		{
			var tag = possible_tags[i];
			switch(tag.name)
			{
				case 'rslidy_background_color':
				{
					frame.style.backgroundColor = tag.content;
					break;
				}
				
				case 'rslidy_background_image':
				{
					frame.style.backgroundImage = tag.content;
					break;
				}
				
				case 'rslidy_border_color':
				{
					for(j in slides)
					{
						slides[j].slide.style.borderColor = tag.content;
						slides[j].slide.style.borderWidth = '0.5rem';
					}
					break;
				}
				
				case 'rslidy_css':
				{
					stylesheets.push(tag.content);
					break;
				}
				case 'rslidy_animated_transition':
				{
					
					if(tag.content == 'true')
					{
						for(j in slides)
						{
							slides[j].slide.classList.add('cprhd_animated');
							animated= true;
						}
					}
					break;
				}
				
				case 'rslidy_title':
				{
					document.title = tag.content;
					title = tag.content;
					break;
				}
				
				case 'rslidy_keycodes':
				{
					try
					{
						var keys = JSON.parse(tag.content);
						keycodes.left = keys.left;
						keycodes.right = keys.right;
						keycodes.up = keys.up;
						keycodes.down = keys.down;
						keycodes.lock = keys.lock;
						keycodes.nav = keys.nav;
					}
					catch(e)
					{
						set_message("Could not set keys!");
					}
					break;
				}
				
				case 'rslidy_touch':
				{
					if(tag.content == 'true')
					{
						mobile = true;
					}
					else if(tag.content == 'false')
					{
						mobile = false;
					}
					break;
				}
				
				case 'rslidy_statusbar':
				{
					if(tag.content == 'false')
					{
						status.frame.classList.add('cprhd_hidden');
						frame.classList.add('cprhd_frame_nostatus');
					}
					break;
				}
			}
		}
	}
	
	var load_css = function()
	{
		for(var i in stylesheets)
		{
			var stylesheet = document.createElement('link');
			stylesheet.rel = 'stylesheet';
			stylesheet.href = stylesheets[i];
			document.head.appendChild(stylesheet);
		}
	}
	
	var load_js = function()
	{
				
		for(var i in scripts)
		{

			var script = document.createElement('script');
			script.type = "text/javascript";
			script.language = "javascript";
			script.src = 'scripts/' + scripts[i];
//			document.head.appendChild(script);
		}
	}
	var load_from_url = function()
	{
		var regex = /#\[(\d),(\d)\]/;
		var data = regex.exec(window.location);
		if(data == null)
		{
			return;
		}
		
		slide_jump(data[1]);
		step_jump(data[2]);
	}
	
	var generate_slideshow = function()
	{
		var cprhd_status = document.createElement('div');
	
		cprhd_status.classList.add('cprhd_status');
		cprhd_status.appendChild(document.createTextNode('Slide: '));
		cprhd_status_slide_number = document.createElement('span');
		cprhd_status.appendChild(cprhd_status_slide_number);
		cprhd_status.appendChild(document.createTextNode('/'));
		cprhd_status_slide_amount = document.createElement('span');
		cprhd_status.appendChild(cprhd_status_slide_amount);
		cprhd_status.appendChild(document.createTextNode(' Step: '));
		cprhd_status_step_number = document.createElement('span');
		cprhd_status.appendChild(cprhd_status_step_number);
		cprhd_status.appendChild(document.createTextNode('/'));
		cprhd_status_step_amount = document.createElement('span');
		cprhd_status.appendChild(cprhd_status_step_amount);
		
		cprhd_status_message = document.createElement('div');
		cprhd_status_message.style.cssFloat = "right";
		cprhd_status.appendChild(cprhd_status_message);
		
		
		status = {frame:cprhd_status,slide_number:cprhd_status_slide_number,slide_amount:cprhd_status_slide_amount,step_number:cprhd_status_step_number,step_amount:cprhd_status_step_amount,status_message:cprhd_status_message};
		
		var toc = document.createElement('div');
		toc.classList.add('cprhd_toc_frame')
		var toc_button = document.createElement('div');
		toc_button.classList.add('cprhd_toc_button')
		var toc_button_menu = document.createElement('div');
		toc_button_menu.classList.add('cprhd_toc_button_menu')
		toc_button.appendChild(toc_button_menu);
		//var toc_buttstrap = document.createElement('div');
		//toc_buttstrap.classList.add('cprhd_toc_buttstrap');
		//toc.appendChild(toc_buttstrap);
		slide_in = {frame:toc,/*buttstrap:toc_buttstrap,*/button:toc_button, menu:toc_button_menu};
		
		var cprhd_frame = document.createElement('div');
		cprhd_frame.classList.add('cprhd_frame');
		
		for(var i = 0; i<slides.length; ++i)
		{
			var cprhd_slide = slides[i].slide;
			cprhd_slide.classList.add('cprhd_slide');
			cprhd_frame.appendChild(cprhd_slide);
		}
		document.body.insertBefore(toc,document.body.firstChild);
		document.body.insertBefore(toc_button,document.body.firstChild);
		document.body.insertBefore(cprhd_status,document.body.firstChild);
		document.body.insertBefore(cprhd_frame,document.body.firstChild);
		frame = cprhd_frame;
	}
	
	var update_status = function()
	{
		status.slide_number.innerHTML = state.slide_number + 1;
		status.slide_amount.innerHTML = slides.length;
		status.step_number.innerHTML = slides[state.slide_number].step_index + 1;
		status.step_amount.innerHTML = Math.max(slides[state.slide_number].increment_objects.length + 1,1);
		document.title = title + ' - ' + (state.slide_number + 1) + ':' + (slides[state.slide_number].step_index + 1);
	}
	
	var set_message = function(message)
	{
		status.status_message.innerHTML = message;
	}
	
	var generate_toc = function()
	{
		for(var i = 0; i<slides.length; ++i)
		{
			var slide_container = document.createElement('div');
			slide_container.classList.add('cprhd_slide_preview_container');
			var toc_slide = slides[i].slide.cloneNode(true);
			toc_slide.classList.remove('cprhd_slide');
			toc_slide.classList.add('cprhd_slide_preview');
			slide_container.addEventListener('click',(function(index){return function(){slide_jump(index)};})(i+1));
			slide_container.appendChild(toc_slide);
			slide_in.frame.appendChild(slide_container);
		}
	}
	
	var add_event_listeners = function()
	{
		document.addEventListener('keydown',handle_keypress,false);
		//slide_in.buttstrap.addEventListener('click',slide_in_toggle,false);
		slide_in.button.addEventListener('click',slide_in_toggle,false);
		
		frame.addEventListener("pointerdown",handle_event,false);
		frame.addEventListener("pointerup",handle_event,false);
		frame.addEventListener("pointermove", handle_event, false);
        
        
        var hammertime;
		
		if(mobile)
		{
			hammertime = Hammer(frame, {
            swipe_velocity: 0.35
        	});
		}
		else
		{
			hammertime = Hammer(frame, {
            swipe_velocity: 0.35,
            stop_browser_behavior: false
        	});
		}
        hammertime.on("swipeleft", handle_event, false);
        hammertime.on("swiperight", handle_event, false);
        hammertime.on("tap", handle_event, false);
        /*Hammer(frame).on("swipeleft", handle_event, false);
        Hammer(frame).on("swiperight", handle_event, false);
        Hammer(frame).on("tap", handle_event, false);*/
 
	}
	
	var extract_slides = function()
	{
		var slides_to_remove = new Array();
		var possible_slides = document.getElementsByTagName('div');
		
		for(var i = 0; i < possible_slides.length; ++i)
		{
			if(possible_slides[i].classList.contains('slide'))
			{
				new slide(possible_slides[i]);
				slides_to_remove.push(possible_slides[i]);
			}
		}
		
		while(slides_to_remove.length !=0)
		{
			var slide_to_remove = slides_to_remove.pop();
			try
			{
				slide_to_remove.remove();
			}
			catch(e)
			{
				slide_to_remove.parentNode.removeChild(slide_to_remove);
			}
		}
	}
	
	var popup = function()
	{
		this.popup;
		var new_popup = document.createElement('div');
		new_popup.classList.add('cprhd_popup');
		document.body.appendChild(new_popup);
		setTimeout(function(){new_popup.classList.add('cprhd_popup_visible')},1);
		this.remove = function(popup_to_remove)
		{
			this.popup.classList.remove('cprhd_popup_visible');
			setTimeout((function(popup_ref){return function(){popup_ref.remove();}})(this.popup),1000);
		}
		this.popup = new_popup;
	}
	
	var connect = function()
	{	
		if(!rcon.socket_status())
		{
			rcon.connect('auto');
			return;
		}	
		locked = true;
		
		var query_frame = document.createElement('div');
		var query_popup = new popup();
		query_frame.appendChild(document.createTextNode('Connect as: '));
		query_frame.appendChild(document.createElement('br'));
		var button_master = document.createElement('button');
		button_master.type = 'button';
		button_master.classList.add('cprhd_button');
		button_master.appendChild(document.createTextNode('Master'));
		var button_slave = document.createElement('button');
		button_slave.type = 'button';
		button_slave.classList.add('cprhd_button');
		button_slave.appendChild(document.createTextNode('Slave'));
		var button_auto = document.createElement('button');
		button_auto.type = 'button';
		button_auto.classList.add('cprhd_button');
		button_auto.appendChild(document.createTextNode('Autonomous'));

		button_master.addEventListener('click',function(){rcon.connect('master'); query_popup.remove();},false);
		button_slave.addEventListener('click',function(){rcon.connect('slave'); query_popup.remove();},false);

		button_auto.addEventListener('click',function(){rcon.connect('auto'); query_popup.remove();},false);
		
		query_frame.appendChild(button_master);
		query_frame.appendChild(button_slave);
		query_frame.appendChild(button_auto);
		query_popup.popup.appendChild(query_frame);
	}
	
	var remote_control = function()
	{
		var socket_ready = false;
		var connection_type = null;
		var web_socket;
		
		this.socket_status = function()
		{
			return socket_ready;
		}
		
		try
		{
			web_socket = new WebSocket("ws://127.0.0.1:1337");
		}
		catch(e)
		{
			return;
		}
		
		web_socket.onerror = function()
		{
//			alert("could not connect");
		}
		
		web_socket.onopen = function()
		{
			socket_ready = true;
			web_socket.send(construct_message("hello",""));
		}
		web_socket.onmessage = function(evt)
		{
			handle_message(evt.data);
		}
		
		this.connect = function(type)
		{
			connection_type = type
			if((type != 'master') && (type != 'slave'))
			{
				locked=false;
//				web_socket.close();
				return;
			}
			web_socket.send(construct_message("connection_type",type));
			locked=false;
		}
		
		this.send_message = function(message)
		{
			if((!this.socket_status()) || (connection_type != "master"))
			{
				return;
			}
			web_socket.send(construct_message("message",message));
		}
		
		this.broadcast = function(message)
		{
			if((!this.socket_status()) || (connection_type != "master"))
			{
				return;
			}
			web_socket.send(construct_message("broadcast",message));
		}
		
		var handle_message = function(message)
		{
			if(connection_type != "slave")
			{
				alert("i am not slave!");
				return;
			}
			
			var message_array = message.split('|');
			message = {timestamp:message_array[0]*1000,type:message_array[1],text:message_array[2],sender:message_array[3]};
			
			switch(message.text)
			{
				case 'slide_next':
				{
					slide_next();
					break;
				}
				case 'slide_prev':
				{
					slide_prev();
					break;
				}
				case 'step_next':
				{
					step_next();
					break;
				}
				case 'step_prev':
				{
					step_prev();
					break;
				}
				default:
				{
					var message_split = message.text.split(';');
//					alert(message_split[1]);
					slide_jump(message_split[1]);
					break;
				}
			}
		}
		
		var construct_message = function(type,message)
		{
			var message_to_send = "";
			message_to_send += Math.floor(new Date()/1000) + "|" + type + "|" + message + "|" + id;
			return message_to_send;
		}
		
		var generateUUID = function() 
		{
			var d = new Date().getTime();
			var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = (d + Math.random()*16)%16 | 0;
				d = Math.floor(d/16);
				return (c=='x' ? r : (r&0x7|0x8)).toString(16);
			});
			return uuid;
		};
		
		var id = generateUUID();
	}
	
	var pointer_control = function()
	{
		var coords_start = {x:0,y:0};
		var coords_move = {x:0,y:0};
		var timestamp = {start:0,finish:0};
		var track = false;
		
		var threshold = {time:500,distance_fast:0.05,distance_slow:0.5};
		
		var reset_track = function()
		{
			coords_start.x = 0;
			coords_start.y = 0;
			
			coords_move.x = 0;
			coords_move.y = 0;
			
			timestamp.start = 0;
			timestamp.finish = 0;
		}
		
		this.down = function(evt)
		{
			if(locked)
			{
				return;
			}
//			set_message("POINTER DOWN");
			track = true;
			coords_start.x = evt.pageX;
			coords_start.y = evt.pageY;
			coords_move.x = evt.pageX;
			coords_move.y = evt.pageY;
			timestamp.start = new Date();
		}
		this.up = function(evt)
		{
			if(!track)
			{
				return;
			}
//			set_message("POINTER UP");
			timestamp.finish = new Date();
			var timespan = timestamp.finish - timestamp.start;
			
			var movement = {x:coords_move.x - coords_start.x,x:coords_move.x - coords_start.x};
			if(timespan < threshold.time)
			{
				if(Math.abs(movement.x) < (window.innerWidth * threshold.distance_fast))
				{
					if(evt.pageX < (frame.offsetLeft + (frame.offsetWidth / 2)))
					{
						step_prev();
					}
					else
					{
						step_next();
					}
					
				}
				else
				{
					if(movement.x > 0)
					{
						slide_prev();
					}
					else
					{
						slide_next();
					}
				}
			}
			else
			{
				if(Math.abs(movement.x) > (window.innerWidth * threshold.distance_slow))
				{
					if(movement.x > 0)
					{
						slide_prev();
					}
					else
					{
						slide_next();
					}
				}
				else
				{
					slide_jump(state.slide_number + 1);
				}
			}
			
			track = false;
			reset_track();
		}
		this.move = function(evt)
		{
			if(!track)
			{
				return;
			}
//			set_message("POINTER MOVE");
			
			coords_move.x = evt.pageX;
			coords_move.y = evt.pageY;

			var movement = {x:coords_move.x - coords_start.x,x:coords_move.x - coords_start.x};
			
			if(mobile)
			{
				if(movement.x > 0)
				{
					slide_prev();
				}
				else
				{
					slide_next();
				}
				return;
			}
			if(!animated)
			{
				return;
			}
			
			frame.classList.add("unhook_slides");
			
					
			for(var i = 0; i<slides.length; ++i)
			{
				slides[i].slide.style.left = (state.slide_number*frame.offsetWidth * -1) + movement.x + 'px';
			}
			frame.classList.remove("unhook_slides");
		}
	}
	
	var detect_mobile = function()
	{
		if( navigator.userAgent.match(/Android/i)
		|| navigator.userAgent.match(/webOS/i)
		|| navigator.userAgent.match(/iPhone/i)
		|| navigator.userAgent.match(/iPad/i)
		|| navigator.userAgent.match(/iPod/i)
		|| navigator.userAgent.match(/BlackBerry/i)
		|| navigator.userAgent.match(/Windows Phone/i)
		)
		{
			mobile =  true;
		}
		else 
		{
			mobile = false;
		}
	}
	
	var pointer = new pointer_control;
	var rcon = new remote_control();
	
	startup();
	
	
	//----------------- HELPER FUNCTIONS
	
	var dump_slide_info = function()
	{
	}
}

document.addEventListener("DOMContentLoaded", function(){new copperhead();}, false);

