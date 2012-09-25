/**
* rotation 2.3
* 2012-09-04
*
* Jean-Baptiste Demonte
* jbdemonte@gmail.com
* http://jb.demonte.fr/jquery/flow/
*
* This work is licensed under the Creative Commons Attribution - Attribution-NonCommercial
* To view a copy of this license, visit http://creativecommons.org/licenses/by-nc/3.0/
*/
(function ($, undef) {
    $.fn.flow("plugin", "rotation", {
        init: function (items, context) {
            context.data.xradius = $(this).width() >> 1;
            context.data.yradius = $(this).height() >> 1;
        },
        animate: function (items, context) {
            var p,
                scale,
                width,
                height,
                minHeight,
                maxHeight;

            $.each(items, function (index, item) {
                var properties = {};
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

                    // cycling position
                    p = (Math.PI / 2) + Math.PI * 2 * (item.current - context.location.offset) / (context.visible - 0);

                    // manage position
                    properties.left = context.data.xradius * (1 - Math.cos(p));
                    properties.top = context.data.yradius * (1 + Math.sin(p));

                    // manage width/height
                    scale = properties.top / (context.data.yradius << 1);

                    minHeight = context.options.height && context.options.height.min ? context.options.height.min : 0;
                    maxHeight = context.options.height && context.options.height.max ? Math.min(context.options.height.max, item.size.height) : 0;

                    height = minHeight + (maxHeight - minHeight)  * scale;
                    width = height * item.size.ratio;

                    // manage opacity
                    properties.opacity = 1;
                    if (context.way > 0) {
                        if (item.current < 0) {
                            if (item.current === -context.before) {
                                properties.opacity = 1 - context.location.offset;
                            }
                        } else if (item.current === context.after - 1) {
                            properties.opacity = context.offset;
                        }
                    } else {
                        if (item.current > 0) {
                            if (item.current === context.after) {
                                properties.opacity = 1 - context.location.offset;
                            }
                        } else if (item.current === -context.before + 1) {
                            properties.opacity = context.offset;
                        }
                    }
                }

                properties.top -= height >> 1;
                properties.left -= width >> 1;
                properties.zIndex = 100 - Math.abs(item.current);

                item.data.hidden = properties.opacity === 0;

                item.element
                    .css(properties)
                    .width(Math.floor(width) + 'px')
                    .height(Math.floor(height) + 'px');
            });
        }
    });
})(jQuery);