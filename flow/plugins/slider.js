/**
 * slider 2.1
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
 *  vertical : boolean (optional)
 *  position : string
 *             if vertical = true : left / middle / right
 *             else : top / middle / bottom  
 */
(function ($, undef) {
    $.fn.flow("plugin", "slider", {
        init: function (items, context) {
            var $this = $(this);
            context.data.width = $this.width();
            context.data.height = $this.height();
            context.data.xradius = context.data.width >> 1;
            context.data.yradius = context.data.height >> 1;
        },
        animate: function (items, context) {
            var width,
                height;

            $.each(items, function (index, item) {
                var properties = {},
                    pos,
                    x,
                    y;
                if (item.current === undef) {
                    if (item.data.hidden) {
                        return; // nothing change
                    }
                    properties = {
                        opacity: 0,
                        left: context.data.xradius,
                        top: 0
                    };
                    width = height = 0;
                } else {
                    pos = (item.current - context.location.offset) / (context.visible >> 1);
                    x = 1 - 1 / Math.exp(4 * Math.abs(pos));
                    y = 1 / Math.exp(2 * Math.abs(pos));

                    if (context.options.vertical) {
                        width = y * Math.min(item.size.width, context.data.width);
                        height = width / item.size.ratio;

                        properties.top = item.current - context.location.offset < 0 ? context.data.yradius * (1 - x) : context.data.yradius * (1 + x);
                        properties.top -= height >> 1;
                        properties.zIndex = 100 + context.visible - Math.abs(item.current);
                        properties.opacity = 1;

                        if (context.options.position) {
                            if (context.options.position === "right") {
                                properties.left = Math.min(Math.ceil(context.data.width - width), context.data.width);
                            } else if (context.options.position === "middle") {
                                properties.left = Math.floor((context.data.width - width) >> 1);
                            }
                        }
                    } else {
                        height = y * Math.min(item.size.height, context.data.height);
                        width = height * item.size.ratio;

                        properties.left = item.current - context.location.offset < 0 ? context.data.xradius * (1 - x) : context.data.xradius * (1 + x);
                        properties.left -= width >> 1;
                        properties.zIndex = 100 + context.visible - Math.abs(item.current);
                        properties.opacity = 1;

                        if (context.options.position) {
                            if (context.options.position === "bottom") {
                                properties.top = Math.min(Math.ceil(context.data.height - height), context.data.height);
                            } else if (context.options.position === "middle") {
                                properties.top = Math.floor((context.data.height - height) >> 1);
                            }
                        }
                    }
                }

                item.data.hidden = properties.opacity === 0;

                item.element
                    .css(properties)
                    .width(Math.floor(width) + 'px')
                    .height(Math.floor(height) + 'px');
            });
        }
    });
})(jQuery);