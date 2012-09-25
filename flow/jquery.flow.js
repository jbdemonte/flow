/**
 * jQuery Flow 2.7
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
    /**
    * class ImageLoader
    * Preload image and run callback
    **/
    function ImageLoader() {
        var imgs = {},
            that = this,
            loading = 0,
            loaded = 0,
            update = false,
            bind = {};

        function checkEnd() {
            if (!loading && !update) {
                trigger("end", [{loaded: loaded, total: loaded + loading}]);
            }
        }

        function ok(src) {
            loading -= 1;
            loaded += 1;
            trigger("update", [{src: src, loaded: loaded, total: loaded + loading}]);
            checkEnd();
        }

        function load(src) {
            var img = new Image();
            imgs[src] = true;
            loading += 1;
            img.onload = function () {
                ok.call(that, src);
            };
            img.src = src;
        }

        function trigger(type, args) {
            if (bind.hasOwnProperty(type)) {
                $.each(bind[type], function (i, fnc) {
                    fnc.apply(that, args);
                });
            }
        }

        this.startUpdate = function () {
            update = true;
        };

        this.endUpdate = function () {
            update = false;
            checkEnd();
        };

        this.bind = function (type, mixed) {
            if (!bind.hasOwnProperty(type)) {
                bind[type] = [];
            }
            if (typeof mixed === "function") {
                bind[type].push(mixed);
            } else if (typeof mixed === "object") {
                $.each(mixed, function (mixed) {
                    that.bind.apply(that, [type, mixed]);
                });
            }
        };

        this.add = function (img) {
            var src = $(img).attr("src");
            if (imgs.hasOwnProperty(src)) {
                return false;
            }
            load(src);
            return true;
        };
    }

    /**
    * class Cycle
    * manage cycling incrementation (0 <= x < Max)
    **/
    function Cycle(max, val) {
        // manage cycle
        function check() {
            if (!max) {
                return;
            }
            while (val < 0) {
                val += max;
            }
            while (val >= max) {
                val -= max;
            }
        }

        // increment value
        this.inc = function (inc) {
            val += inc;
            check();
            return val;
        };

        // define new value
        this.set = function (newVal) {
            val = newVal;
            check();
        };

        this.val = function () {
            return val;
        };
    }

    /**
    * class Torch
    * calculate visible items according to visible rules
    **/
    function Torch(count, before, after) {
        var visibles,
            processed = {};

        // manage "auto"
        if (before === "auto" && after === "auto") {
            before = count >> 1;
            after = count - before - 1;
        } else if (before === "auto") {
            before = count - after - 1;
        } else if (after === "auto") {
            after = count - before - 1;
        }
        visibles = Math.min(count, 1 + before + after);

        // return the visible property of each items around the focused item
        this.list = function (focused) {
            var i,
                idx;
            if (processed.hasOwnProperty(focused)) {
                return processed[focused];
            }
            processed[focused] = {};
            for (i = 0; i < visibles; i += 1) {
                idx = i + focused - before;
                if (idx < 0) {
                    idx += count;
                } else if (idx >= count) {
                    idx -= count;
                }
                processed[focused][idx] = i - before;
            }
            return processed[focused];
        };

        this.before = function () {
            return before;
        };

        this.after = function () {
            return after;
        };

        this.visibles = function () {
            return visibles;
        };
    }

    /**
     * Manageable clock
     * run a callback on intervals
     */
    function Clock(config) {
        var count = 0,
            id = 0,
            elapsed = 0,
            time,
            that = this;

        this.restart = function () {
            this.stop();
            count = 0;
            time = $.now();
            id = setInterval(tick, config.delai);
        };

        function tick() {
            elapsed = $.now() - time;
            count += 1;
            if (elapsed >= config.duration) {
                elapsed = config.duration; // else ratio >= 1
                config.tick.call(config.that);
                that.stop(true);
            } else {
                config.tick.call(config.that);
            }
        }

        this.stop = function (complete) {
            if (id) {
                clearInterval(id);
                id = 0;
                config.stop.call(config.that, complete);
            }
            return this;
        };

        this.value = function () {
            return {count: count, elapsed: elapsed, duration: config.duration};
        };
    }

  /**
   * class Flow
   * main class
   **/
    function Flow($this, opts) {
        var that = this,
            items = [],
            focus = {previous: null, current: null},
            data = opts.data || {},
            target, // = Cycle : need to way the init to get the item count
            way = 1,
            angle,
            current,
            delta,
            loader = new ImageLoader(),
            torch,
            lighthouse,
            clock = new Clock({delai: opts.delai, duration: opts.duration, that: this, tick: tick, stop: stop, debug: opts.debug}),
            binded;

        // load all images
        // ---------------------------
        loader.bind("update", function (mixed) {
            trigger("load_update", mixed);
        });
        loader.bind("end", function (mixed) {
            trigger("load_end", mixed);
            init.apply(that, []);
        });

        trigger("load_begin");

        loader.startUpdate();
        $("img", $this).each(function () {
            loader.add(this);
        });
        loader.endUpdate();
        // ---------------------------

        // trig event and play associated callback
        function trigger(name, arg) {
            var onName = ("on_" + name).replace(/_(\w)/g, function (all, letter) { return letter.toUpperCase(); });
            if (opts.hasOwnProperty(onName) && (typeof opts[onName] === "function")) {
                opts[onName].call($this, arg);
            }
            $this.trigger(name + "." + opts.namespace, [arg]);
        }

        // run after the image loading by the callback
        function init() {
            // locate elements
            $("> *", $this).each(function () {
                var element = $(this),
                    width = element.outerWidth(),
                    height = element.outerHeight();
                items.push({
                    element: element,
                    size: {
                        width : width,
                        height: height,
                        ratio : width / height
                    },
                    position: undef,
                    data: {}
                });
            });

            // is empty ?
            if (!items.length) {
                return;
            }

            torch = new Torch(items.length, opts.visible.before, opts.visible.after);
            lighthouse = new Torch(items.length, "auto", "auto");

            // initial position;
            delta = 1 / items.length;
            current = angle = -delta;
            target = new Cycle(items.length, 0);

            if (opts.init) {
                opts.init.call($this, items, {
                    data: data,
                    before: torch.before(),
                    after: torch.after(),
                    count: items.length,
                    visible: torch.visibles(),
                    options: opts
                });
            }
            clock.restart();
        }

        // return current visible location
        function locate() {
            var pos,
                item,
                offset,
                cl = clock.value(),
                r = cl.elapsed ? opts.easing(cl.elapsed / cl.duration, cl.elapsed, 0, 1, cl.duration) : 0,
                angleFinal = delta * target.val(),
                distance = 1 - angle + angleFinal;

            while (distance >= 1) {
                distance -= 1;
            }
            if (way < 0) {
                distance = 1 - distance;
            }

            current = angle + way * r * distance;
            if (Math.abs(current) < 0.0001) {
                current = 0;
            }
            if (current < 0) {
                current += 1;
            }
            while (current >= 1) {
                current -= 1;
            }

            pos = current / delta;

            item = Math.round(pos);
            offset = pos - item;
            // 0 float => 0 int
            if (Math.abs(offset) < 0.0001) {
                offset = 0;
            }

            if (item >= items.length) {
                item = 0;
            }
            return {item: item, offset: offset};
        }

        function tick() {
            var prev,
                pos,
                loc = locate(),
                list = torch.list(loc.item),
                full = lighthouse.list(loc.item),
                context = {
                    target: target.val(),
                    location: loc,
                    way: way,
                    data: data,
                    before: torch.before(),
                    after: torch.after(),
                    count: items.length,
                    visible: torch.visibles(),
                    options: opts
                },
                itemList = [];
            $.each(items, function (i, item) {
                prev = item.position;
                pos = list[i]; // can be undefined
                if (loc.offset === 0) {
                    item.position = pos;
                    if (pos === 0) {
                        focus.previous = focus.current;
                        focus.current = {
                            element: item.element
                        };
                    }
                }
                itemList.push({
                    element: item.element,
                    previous: prev,
                    current: pos,
                    position: full[i],
                    size: item.size,
                    data: item.data
                });
            });
            opts.animate.call($this, itemList, context);
        }

        function stop(complete) {
            angle = current;
            trigger("run_end", {complete: complete, current: focus.current, previous: focus.previous});
        }

        this.slide = function (to, toBinded) {
            var list,
                prevWay = way,
                loc = locate(),
                cl = clock.stop().value();
            if ((to === "next") || (to === "previous")) {
                way = to === "next" ? 1 : -1;
                if ((prevWay === way) || (cl.elapsed === cl.duration)) {
                    target.inc(way);
                } else {
                    target.set(loc.item + way);
                }
            } else {
                if (loc.item === to) { // target = location : nothing change
                    return;
                }
                list = lighthouse.list(to);
                way = list[loc.item] < list[to] ? 1 : -1;
                target.set(to);
            }
            if (toBinded !== undef) {
                binded = toBinded;
            }
            clock.restart();
        };
    }

    var plugins = {};

  /**
   * function flow  
   * jQuery Wrapper
   **/
    $.fn.flow = function (mixed) {
        var k,
            opts;
        if (typeof mixed === "string") {
            mixed = mixed.toLowerCase();
            if (mixed === 'plugin') {
                plugins[arguments[1]] = arguments[2];
                return this;
            }
            if ((mixed !== "next") && (mixed !== "previous")) {
                mixed = parseInt(mixed, 10);
            }
        }
        if ((typeof mixed === "number") || (mixed === "next") || (mixed === "previous")) {
            this.each(function () {
                var f =  $.data(this, "flow");
                if (f) {
                    f.slide(mixed, arguments[1]); // todo: checker cet argument : devrait etre l'argument principal
                }
            });
        } else {
            if (typeof mixed !== "object") {
                mixed = {};
            }
            // use the first plugin defined if a non existing one is called or if animate function is not defined
            if (!((mixed.plugin && plugins.hasOwnProperty(mixed.plugin)) || mixed.hasOwnProperty("animate"))) {
                for (k in plugins) {
                    if (plugins.hasOwnProperty(k)) {
                        mixed.plugin = k;
                        break;
                    }
                }
            }
            opts = $.extend(
                true,
                {
                    namespace: "flow",
                    visible: {
                        before: "auto",
                        after: "auto"
                    },
                    easing: "",
                    duration: 300,
                    delai: 13
                },
                mixed.plugin && plugins.hasOwnProperty(mixed.plugin) ? plugins[mixed.plugin] : {},
                mixed
            );

            if ((typeof opts.easing === "string") && $.easing.hasOwnProperty(opts.easing)) {
                opts.easing = $.easing[opts.easing];
            }
            if (typeof opts.easing !== "function") {
                opts.easing = $.easing[$.easing.def || "swing"];
            }

            this.each(function () {
                $.data(this, "flow", new Flow($(this), opts));
            });
        }
        return this;
    };

})(jQuery);