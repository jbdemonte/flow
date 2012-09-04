/**
 * carousel 2.0
 * 2012-09-04 
 * 
 * Jean-Baptiste Demonte 
 * jbdemonte@gmail.com
 * http://jb.demonte.fr/jquery/flow/
 *  
 * This work is licensed under the Creative Commons Attribution - Attribution-NonCommercial 
 * To view a copy of this license, visit http://creativecommons.org/licenses/by-nc/3.0/
 * 
 * options:
 *  width : integer (optional) : max width
 *  height : integer (optional) : max height
 */
;(function($, undefined){
  $.fn.flow("plugin", "carousel", {
    init: function(items, context){
      context.data.width = $(this).width();
      context.data.height = $(this).height();
      
      $.each(items, function(index, item){
        var width, height;
        height = Math.min(item.size.height, context.data.height);
        if (context.options.height){
          height = Math.min(height, context.options.height);
        }
        width = height * item.size.ratio;
        if (context.options.width && (width > context.options.width)){
          width = context.options.width;
          height = width / item.size.ratio;
        }
        item.element
          .css("top", ((context.data.height - height) >> 1) + "px")
          .width(Math.floor(width) + 'px')
          .height(Math.floor(height) + 'px');
        item.data.width = width;
      });
    },
    animate: function(items, context){
      var space = (context.data.width - context.visible * context.options.width) / context.visible,
        width, height;
      $.each(items, function(index, item){
        var properties = {};
      	if ( (item.current === undefined) && (item.position < -context.before-1 || item.position > context.after+1) ){
          if (item.data.hidden){
            return; // nothing change
          }
          properties.display = "none";
      	} else {
        	properties.left = (context.data.width - context.options.width >> 1) + (item.position-context.location.offset) * (space + context.options.width );
        	
        	if (item.data.hidden){
            properties.display = "block";
        	}
        }
        if (properties.display){
          item.data.hidden = properties.display === "none";
        }
        item.element.css(properties);
    	});
  	}
  });
})(jQuery);