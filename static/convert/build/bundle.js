
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() {}

    function add_location(element, file, line, column, char) {
      element.__svelte_meta = {
        loc: {
          file,
          line,
          column,
          char
        }
      };
    }

    function run(fn) {
      return fn();
    }

    function blank_object() {
      return Object.create(null);
    }

    function run_all(fns) {
      fns.forEach(run);
    }

    function is_function(thing) {
      return typeof thing === 'function';
    }

    function safe_not_equal(a, b) {
      return a != a ? b == b : a !== b || a && typeof a === 'object' || typeof a === 'function';
    }

    let src_url_equal_anchor;

    function src_url_equal(element_src, url) {
      if (!src_url_equal_anchor) {
        src_url_equal_anchor = document.createElement('a');
      }

      src_url_equal_anchor.href = url;
      return element_src === src_url_equal_anchor.href;
    }

    function is_empty(obj) {
      return Object.keys(obj).length === 0;
    }

    function append(target, node) {
      target.appendChild(node);
    }

    function insert(target, node, anchor) {
      target.insertBefore(node, anchor || null);
    }

    function detach(node) {
      node.parentNode.removeChild(node);
    }

    function destroy_each(iterations, detaching) {
      for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i]) iterations[i].d(detaching);
      }
    }

    function element(name) {
      return document.createElement(name);
    }

    function text(data) {
      return document.createTextNode(data);
    }

    function space() {
      return text(' ');
    }

    function empty() {
      return text('');
    }

    function listen(node, event, handler, options) {
      node.addEventListener(event, handler, options);
      return () => node.removeEventListener(event, handler, options);
    }

    function attr(node, attribute, value) {
      if (value == null) node.removeAttribute(attribute);else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
    }

    function children(element) {
      return Array.from(element.childNodes);
    }

    function custom_event(type, detail, {
      bubbles = false,
      cancelable = false
    }) {
      const e = document.createEvent('CustomEvent');
      e.initCustomEvent(type, bubbles, cancelable, detail);
      return e;
    }

    let current_component;

    function set_current_component(component) {
      current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;

    function schedule_update() {
      if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
      }
    }

    function add_render_callback(fn) {
      render_callbacks.push(fn);
    }
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.


    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function

    function flush() {
      const saved_component = current_component;

      do {
        // first, call beforeUpdate functions
        // and update components
        while (flushidx < dirty_components.length) {
          const component = dirty_components[flushidx];
          flushidx++;
          set_current_component(component);
          update(component.$$);
        }

        set_current_component(null);
        dirty_components.length = 0;
        flushidx = 0;

        while (binding_callbacks.length) binding_callbacks.pop()(); // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...


        for (let i = 0; i < render_callbacks.length; i += 1) {
          const callback = render_callbacks[i];

          if (!seen_callbacks.has(callback)) {
            // ...so guard against infinite loops
            seen_callbacks.add(callback);
            callback();
          }
        }

        render_callbacks.length = 0;
      } while (dirty_components.length);

      while (flush_callbacks.length) {
        flush_callbacks.pop()();
      }

      update_scheduled = false;
      seen_callbacks.clear();
      set_current_component(saved_component);
    }

    function update($$) {
      if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
      }
    }

    const outroing = new Set();
    let outros;

    function group_outros() {
      outros = {
        r: 0,
        c: [],
        p: outros // parent group

      };
    }

    function check_outros() {
      if (!outros.r) {
        run_all(outros.c);
      }

      outros = outros.p;
    }

    function transition_in(block, local) {
      if (block && block.i) {
        outroing.delete(block);
        block.i(local);
      }
    }

    function transition_out(block, local, detach, callback) {
      if (block && block.o) {
        if (outroing.has(block)) return;
        outroing.add(block);
        outros.c.push(() => {
          outroing.delete(block);

          if (callback) {
            if (detach) block.d(1);
            callback();
          }
        });
        block.o(local);
      }
    }

    const globals = typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : global;

    function create_component(block) {
      block && block.c();
    }

    function mount_component(component, target, anchor, customElement) {
      const {
        fragment,
        on_mount,
        on_destroy,
        after_update
      } = component.$$;
      fragment && fragment.m(target, anchor);

      if (!customElement) {
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
          const new_on_destroy = on_mount.map(run).filter(is_function);

          if (on_destroy) {
            on_destroy.push(...new_on_destroy);
          } else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
          }

          component.$$.on_mount = [];
        });
      }

      after_update.forEach(add_render_callback);
    }

    function destroy_component(component, detaching) {
      const $$ = component.$$;

      if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching); // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)

        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
      }
    }

    function make_dirty(component, i) {
      if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
      }

      component.$$.dirty[i / 31 | 0] |= 1 << i % 31;
    }

    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
      const parent_component = current_component;
      set_current_component(component);
      const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        on_disconnect: [],
        before_update: [],
        after_update: [],
        context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false,
        root: options.target || parent_component.$$.root
      };
      append_styles && append_styles($$.root);
      let ready = false;
      $$.ctx = instance ? instance(component, options.props || {}, (i, ret, ...rest) => {
        const value = rest.length ? rest[0] : ret;

        if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
          if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
          if (ready) make_dirty(component, i);
        }

        return ret;
      }) : [];
      $$.update();
      ready = true;
      run_all($$.before_update); // `false` as a special case of no DOM component

      $$.fragment = create_fragment ? create_fragment($$.ctx) : false;

      if (options.target) {
        if (options.hydrate) {
          const nodes = children(options.target); // eslint-disable-next-line @typescript-eslint/no-non-null-assertion

          $$.fragment && $$.fragment.l(nodes);
          nodes.forEach(detach);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          $$.fragment && $$.fragment.c();
        }

        if (options.intro) transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor, options.customElement);
        flush();
      }

      set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */


    class SvelteComponent {
      $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
      }

      $on(type, callback) {
        const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
        callbacks.push(callback);
        return () => {
          const index = callbacks.indexOf(callback);
          if (index !== -1) callbacks.splice(index, 1);
        };
      }

      $set($$props) {
        if (this.$$set && !is_empty($$props)) {
          this.$$.skip_bound = true;
          this.$$set($$props);
          this.$$.skip_bound = false;
        }
      }

    }

    function dispatch_dev(type, detail) {
      document.dispatchEvent(custom_event(type, Object.assign({
        version: '3.48.0'
      }, detail), {
        bubbles: true
      }));
    }

    function append_dev(target, node) {
      dispatch_dev('SvelteDOMInsert', {
        target,
        node
      });
      append(target, node);
    }

    function insert_dev(target, node, anchor) {
      dispatch_dev('SvelteDOMInsert', {
        target,
        node,
        anchor
      });
      insert(target, node, anchor);
    }

    function detach_dev(node) {
      dispatch_dev('SvelteDOMRemove', {
        node
      });
      detach(node);
    }

    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
      const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
      if (has_prevent_default) modifiers.push('preventDefault');
      if (has_stop_propagation) modifiers.push('stopPropagation');
      dispatch_dev('SvelteDOMAddEventListener', {
        node,
        event,
        handler,
        modifiers
      });
      const dispose = listen(node, event, handler, options);
      return () => {
        dispatch_dev('SvelteDOMRemoveEventListener', {
          node,
          event,
          handler,
          modifiers
        });
        dispose();
      };
    }

    function attr_dev(node, attribute, value) {
      attr(node, attribute, value);
      if (value == null) dispatch_dev('SvelteDOMRemoveAttribute', {
        node,
        attribute
      });else dispatch_dev('SvelteDOMSetAttribute', {
        node,
        attribute,
        value
      });
    }

    function set_data_dev(text, data) {
      data = '' + data;
      if (text.wholeText === data) return;
      dispatch_dev('SvelteDOMSetData', {
        node: text,
        data
      });
      text.data = data;
    }

    function validate_each_argument(arg) {
      if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
        let msg = '{#each} only iterates over array-like objects.';

        if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
          msg += ' You can use a spread to convert this iterable into an array.';
        }

        throw new Error(msg);
      }
    }

    function validate_slots(name, slot, keys) {
      for (const slot_key of Object.keys(slot)) {
        if (!~keys.indexOf(slot_key)) {
          console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
        }
      }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */


    class SvelteComponentDev extends SvelteComponent {
      constructor(options) {
        if (!options || !options.target && !options.$$inline) {
          throw new Error("'target' is a required option");
        }

        super();
      }

      $destroy() {
        super.$destroy();

        this.$destroy = () => {
          console.warn('Component was already destroyed'); // eslint-disable-line no-console
        };
      }

      $capture_state() {}

      $inject_state() {}

    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */


    function writable(value, start = noop) {
      let stop;
      const subscribers = new Set();

      function set(new_value) {
        if (safe_not_equal(value, new_value)) {
          value = new_value;

          if (stop) {
            // store is ready
            const run_queue = !subscriber_queue.length;

            for (const subscriber of subscribers) {
              subscriber[1]();
              subscriber_queue.push(subscriber, value);
            }

            if (run_queue) {
              for (let i = 0; i < subscriber_queue.length; i += 2) {
                subscriber_queue[i][0](subscriber_queue[i + 1]);
              }

              subscriber_queue.length = 0;
            }
          }
        }
      }

      function update(fn) {
        set(fn(value));
      }

      function subscribe(run, invalidate = noop) {
        const subscriber = [run, invalidate];
        subscribers.add(subscriber);

        if (subscribers.size === 1) {
          stop = start(set) || noop;
        }

        run(value);
        return () => {
          subscribers.delete(subscriber);

          if (subscribers.size === 0) {
            stop();
            stop = null;
          }
        };
      }

      return {
        set,
        update,
        subscribe
      };
    }

    const dropZone = document.body;
    dropZone.addEventListener("dragenter", dragenter, false);
    dropZone.addEventListener("dragover", dragover, false);
    dropZone.addEventListener("drop", drop, false);

    function dragenter(e) {
      e.stopPropagation();
      e.preventDefault();
    }

    function dragover(e) {
      e.stopPropagation();
      e.preventDefault();
    }

    function drop(e) {
      e.stopPropagation();
      e.preventDefault();
      let files = e.dataTransfer.files; // Array of all files

      fileModify(files);
    }

    let fileId = 0;

    function fileModify(files) {
      for (const file of files) {
        let regText = 'image.' + config.check;

        if (file.type.match(regText)) {
          fileReed(file, true);
        } else if (file.type.match(/image.*/)) {
          fileReed(file, false);
        }
      }

      function fileReed(file, format) {
        let reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = e2 => {
          const newItem = {
            id: fileId++,
            content: file,
            other: e2,
            img: reader.result,
            result: "",
            resultOk: false,
            boolType: format
          };
          fileList.update(n => {
            n.push(newItem);
            return n;
          });
        };
      }
    }

    async function choiseFileForSend(id) {
      let fileListValue;
      let item; //$: console.log(fileListValue)

      fileList.subscribe(value => {
        fileListValue = value;
      });

      for (const fileListValueElement of fileListValue) {
        if (fileListValueElement.id === id) {
          item = fileListValueElement;
        }
      }

      const result = await sendOneFile(item);

      if (result !== null) {
        item.resultOk = true;
        item.result = result;
      }

      fileList.update(n => {
        n.forEach((element, index) => index === item.id ? item : element);
        console.log(n);
        return n;
      });
    }

    async function sendOneFile(fileOldFormat) {
      //return "base64"
      let response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(fileOldFormat)
      });

      if (response.ok) {
        let json = await response.json();
        return json;
      } else {
        console.log("Ошибка HTTP: " + response.status);
        return null;
      }
    }

    function downloadImg(id) {
      let fileListValue;
      let item;
      fileList.subscribe(value => {
        fileListValue = value;
      });

      for (const fileListValueElement of fileListValue) {
        if (fileListValueElement.id === id) {
          item = fileListValueElement;
        }
      } //let name = item.content.name.splice('.')[0];


      let name = item.content.name.replace(/\.[^.$]+$/, '');
      var a = document.createElement("a"); //Create <a>

      a.href = item.result.body; //"data:image/png;base64," + ImageBase64; //Image Base64 Goes here

      a.download = name + "." + config.to; //File name Here

      a.click();
    }

    function deleteItemF(dellItem) {
      fileList.update(n => {
        const newN = n.filter(item => item.id !== dellItem.id);
        return newN;
      });
    }

    const deleteItem = deleteItemF;
    const singlSend = choiseFileForSend;
    const downloadFile = downloadImg;
    const funcFileRead = fileModify;
    const fileList = writable([]);

    const lang = {
      en: {
        upload: "Upload",
        downloadTo: "Download to",
        downloadAll: "Download all",
        convertTo: "Convert to",
        convertAll: "Convert All",
        incorrectFormat: "Incorrect format"
      }
    };

    /* src\components\CardFile.svelte generated by Svelte v3.48.0 */
    const file$3 = "src\\components\\CardFile.svelte";

    // (28:16) {:else}
    function create_else_block_2(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*item*/ ctx[0].img)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-98s392");
    			add_location(img, file$3, 28, 20, 663);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 1 && !src_url_equal(img.src, img_src_value = /*item*/ ctx[0].img)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(28:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (26:16) {#if item.resultOk}
    function create_if_block_2(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*item*/ ctx[0].result.body)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-98s392");
    			add_location(img, file$3, 26, 20, 579);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 1 && !src_url_equal(img.src, img_src_value = /*item*/ ctx[0].result.body)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(26:16) {#if item.resultOk}",
    		ctx
    	});

    	return block;
    }

    // (48:8) {:else}
    function create_else_block_1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = `${lang[/*configLang*/ ctx[2]].incorrectFormat}`;
    			attr_dev(span, "class", "bold failed");
    			add_location(span, file$3, 48, 12, 1310);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(48:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (38:8) {#if item.boolType}
    function create_if_block(ctx) {
    	let if_block_anchor;

    	function select_block_type_2(ctx, dirty) {
    		if (/*item*/ ctx[0].resultOk) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(38:8) {#if item.boolType}",
    		ctx
    	});

    	return block;
    }

    // (43:12) {:else}
    function create_else_block(ctx) {
    	let button;
    	let t0_value = lang[/*configLang*/ ctx[2]].convertTo + "";
    	let t0;
    	let t1;
    	let t2_value = /*typeImg*/ ctx[1].to + "";
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			attr_dev(button, "class", "bold but svelte-98s392");
    			add_location(button, file$3, 43, 16, 1124);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);
    			append_dev(button, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*goConvert*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*typeImg*/ 2 && t2_value !== (t2_value = /*typeImg*/ ctx[1].to + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(43:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (39:12) {#if item.resultOk}
    function create_if_block_1(ctx) {
    	let button;
    	let t0_value = lang[/*configLang*/ ctx[2]].downloadTo + "";
    	let t0;
    	let t1;
    	let t2_value = /*typeImg*/ ctx[1].to + "";
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			attr_dev(button, "class", "bold but success svelte-98s392");
    			add_location(button, file$3, 39, 16, 939);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);
    			append_dev(button, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*goDownload*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*typeImg*/ 2 && t2_value !== (t2_value = /*typeImg*/ ctx[1].to + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(39:12) {#if item.resultOk}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div5;
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let span;
    	let t1_value = /*item*/ ctx[0].content.name + "";
    	let t1;
    	let t2;
    	let div4;
    	let t3;
    	let div3;
    	let i;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*item*/ ctx[0].resultOk) return create_if_block_2;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*item*/ ctx[0].boolType) return create_if_block;
    		return create_else_block_1;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			div4 = element("div");
    			if_block1.c();
    			t3 = space();
    			div3 = element("div");
    			i = element("i");
    			attr_dev(div0, "class", "imgBlock svelte-98s392");
    			add_location(div0, file$3, 24, 12, 498);
    			add_location(span, file$3, 33, 12, 775);
    			attr_dev(div1, "class", "");
    			add_location(div1, file$3, 32, 8, 747);
    			attr_dev(div2, "class", "flex svelte-98s392");
    			add_location(div2, file$3, 23, 4, 466);
    			attr_dev(i, "class", "fa-solid fa-xmark svelte-98s392");
    			add_location(i, file$3, 51, 12, 1456);
    			attr_dev(div3, "class", "delete svelte-98s392");
    			add_location(div3, file$3, 50, 8, 1402);
    			attr_dev(div4, "class", "flex svelte-98s392");
    			add_location(div4, file$3, 36, 4, 841);
    			attr_dev(div5, "class", "card svelte-98s392");
    			add_location(div5, file$3, 22, 0, 442);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div2);
    			append_dev(div2, div0);
    			if_block0.m(div0, null);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, span);
    			append_dev(span, t1);
    			append_dev(div5, t2);
    			append_dev(div5, div4);
    			if_block1.m(div4, null);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, i);

    			if (!mounted) {
    				dispose = listen_dev(div3, "click", /*goDelete*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			}

    			if (dirty & /*item*/ 1 && t1_value !== (t1_value = /*item*/ ctx[0].content.name + "")) set_data_dev(t1, t1_value);

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div4, t3);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			if_block0.d();
    			if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CardFile', slots, []);
    	let { item } = $$props;
    	let { typeImg } = $$props;
    	let configLang = typeImg.lang;

    	function goConvert() {
    		singlSend(item.id);
    	}

    	function goDelete() {
    		deleteItem(item);
    	}

    	function goDownload() {
    		downloadFile(item.id);
    	}

    	const writable_props = ['item', 'typeImg'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CardFile> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    		if ('typeImg' in $$props) $$invalidate(1, typeImg = $$props.typeImg);
    	};

    	$$self.$capture_state = () => ({
    		singlSend,
    		deleteItem,
    		downloadFile,
    		lang,
    		item,
    		typeImg,
    		configLang,
    		goConvert,
    		goDelete,
    		goDownload
    	});

    	$$self.$inject_state = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    		if ('typeImg' in $$props) $$invalidate(1, typeImg = $$props.typeImg);
    		if ('configLang' in $$props) $$invalidate(2, configLang = $$props.configLang);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item, typeImg, configLang, goConvert, goDelete, goDownload];
    }

    class CardFile extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { item: 0, typeImg: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CardFile",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !('item' in props)) {
    			console.warn("<CardFile> was created without expected prop 'item'");
    		}

    		if (/*typeImg*/ ctx[1] === undefined && !('typeImg' in props)) {
    			console.warn("<CardFile> was created without expected prop 'typeImg'");
    		}
    	}

    	get item() {
    		throw new Error("<CardFile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<CardFile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get typeImg() {
    		throw new Error("<CardFile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set typeImg(value) {
    		throw new Error("<CardFile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\UploadBlock.svelte generated by Svelte v3.48.0 */

    const { console: console_1$1 } = globals;
    const file$2 = "src\\components\\UploadBlock.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let label;
    	let t3;
    	let input;
    	let div_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			label.textContent = `${/*textUploadLang*/ ctx[2]}  ${/*type*/ ctx[3]}`;
    			t3 = space();
    			input = element("input");
    			attr_dev(label, "for", "fileInput");
    			attr_dev(label, "class", "bold but");
    			add_location(label, file$2, 30, 4, 847);
    			attr_dev(input, "type", "file");
    			attr_dev(input, "class", "hidden svelte-79mznn");
    			attr_dev(input, "id", "fileInput");
    			attr_dev(input, "accept", /*newType*/ ctx[4]);
    			input.multiple = true;
    			add_location(input, file$2, 32, 4, 926);

    			attr_dev(div, "class", div_class_value = "upload-btn " + (/*fileListValue*/ ctx[0].length > 0
    			? 'upload-mini-screan'
    			: 'upload-full-screan') + " svelte-79mznn");

    			add_location(div, file$2, 29, 0, 750);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(div, t3);
    			append_dev(div, input);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_handler*/ ctx[7]),
    					listen_dev(input, "change", /*updateFileList*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*fileListValue*/ 1 && div_class_value !== (div_class_value = "upload-btn " + (/*fileListValue*/ ctx[0].length > 0
    			? 'upload-mini-screan'
    			: 'upload-full-screan') + " svelte-79mznn")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('UploadBlock', slots, []);
    	let { configapp } = $$props;
    	let fileListValue;

    	//$: console.log(fileListValue)
    	let choiseLang = configapp.lang;

    	let textUploadLang = lang[choiseLang].upload;
    	let type = configapp.from;
    	console.log(configapp);
    	let newType = type === "jpg" ? ".jpg .jpeg" : "." + type;

    	fileList.subscribe(value => {
    		$$invalidate(0, fileListValue = value);
    	});

    	let files = [];

    	function updateFileList() {
    		//let fileList = event.target.files;
    		funcFileRead(files);

    		//event.target.failes = new DataTransfer().files
    		document.querySelector('#fileInput').value = "";
    	}

    	const writable_props = ['configapp'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<UploadBlock> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		files = this.files;
    		$$invalidate(1, files);
    	}

    	$$self.$$set = $$props => {
    		if ('configapp' in $$props) $$invalidate(6, configapp = $$props.configapp);
    	};

    	$$self.$capture_state = () => ({
    		fileList,
    		funcFileRead,
    		lang,
    		configapp,
    		fileListValue,
    		choiseLang,
    		textUploadLang,
    		type,
    		newType,
    		files,
    		updateFileList
    	});

    	$$self.$inject_state = $$props => {
    		if ('configapp' in $$props) $$invalidate(6, configapp = $$props.configapp);
    		if ('fileListValue' in $$props) $$invalidate(0, fileListValue = $$props.fileListValue);
    		if ('choiseLang' in $$props) choiseLang = $$props.choiseLang;
    		if ('textUploadLang' in $$props) $$invalidate(2, textUploadLang = $$props.textUploadLang);
    		if ('type' in $$props) $$invalidate(3, type = $$props.type);
    		if ('newType' in $$props) $$invalidate(4, newType = $$props.newType);
    		if ('files' in $$props) $$invalidate(1, files = $$props.files);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		fileListValue,
    		files,
    		textUploadLang,
    		type,
    		newType,
    		updateFileList,
    		configapp,
    		input_change_handler
    	];
    }

    class UploadBlock extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { configapp: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "UploadBlock",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*configapp*/ ctx[6] === undefined && !('configapp' in props)) {
    			console_1$1.warn("<UploadBlock> was created without expected prop 'configapp'");
    		}
    	}

    	get configapp() {
    		throw new Error("<UploadBlock>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set configapp(value) {
    		throw new Error("<UploadBlock>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\ActionAll.svelte generated by Svelte v3.48.0 */
    const file$1 = "src\\components\\ActionAll.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let button0;
    	let t0_value = lang[/*configapp*/ ctx[0].lang].convertAll + "";
    	let t0;
    	let button0_class_value;
    	let t1;
    	let button1;
    	let t2_value = lang[/*configapp*/ ctx[0].lang].downloadAll + "";
    	let t2;
    	let button1_class_value;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			button1 = element("button");
    			t2 = text(t2_value);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", button0_class_value = "bold but " + (/*listOk*/ ctx[2] ? 'hidden' : ''));
    			add_location(button0, file$1, 24, 4, 638);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", button1_class_value = "bold but success " + (/*listOk*/ ctx[2] ? '' : 'hidden'));
    			add_location(button1, file$1, 25, 4, 746);
    			attr_dev(div, "class", div_class_value = "convert " + (/*fileListValue*/ ctx[1].length > 1 ? '' : 'hidden') + " svelte-tgsibi");
    			add_location(div, file$1, 23, 0, 574);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, t0);
    			append_dev(div, t1);
    			append_dev(div, button1);
    			append_dev(button1, t2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*configapp*/ 1 && t0_value !== (t0_value = lang[/*configapp*/ ctx[0].lang].convertAll + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*listOk*/ 4 && button0_class_value !== (button0_class_value = "bold but " + (/*listOk*/ ctx[2] ? 'hidden' : ''))) {
    				attr_dev(button0, "class", button0_class_value);
    			}

    			if (dirty & /*configapp*/ 1 && t2_value !== (t2_value = lang[/*configapp*/ ctx[0].lang].downloadAll + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*listOk*/ 4 && button1_class_value !== (button1_class_value = "bold but success " + (/*listOk*/ ctx[2] ? '' : 'hidden'))) {
    				attr_dev(button1, "class", button1_class_value);
    			}

    			if (dirty & /*fileListValue*/ 2 && div_class_value !== (div_class_value = "convert " + (/*fileListValue*/ ctx[1].length > 1 ? '' : 'hidden') + " svelte-tgsibi")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ActionAll', slots, []);
    	let { configapp } = $$props;
    	let fileListValue;

    	//$: console.log(fileListValue)
    	fileList.subscribe(value => {
    		$$invalidate(1, fileListValue = value);
    	});

    	let listOk = false;
    	const writable_props = ['configapp'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ActionAll> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('configapp' in $$props) $$invalidate(0, configapp = $$props.configapp);
    	};

    	$$self.$capture_state = () => ({
    		fileList,
    		lang,
    		configapp,
    		fileListValue,
    		listOk
    	});

    	$$self.$inject_state = $$props => {
    		if ('configapp' in $$props) $$invalidate(0, configapp = $$props.configapp);
    		if ('fileListValue' in $$props) $$invalidate(1, fileListValue = $$props.fileListValue);
    		if ('listOk' in $$props) $$invalidate(2, listOk = $$props.listOk);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*fileListValue*/ 2) {
    			for (const fileListValueElement of fileListValue) {
    				if (fileListValueElement.resultOk === false) {
    					$$invalidate(2, listOk = false);
    					break;
    				} else {
    					$$invalidate(2, listOk = true);
    				}
    			}
    		}
    	};

    	return [configapp, fileListValue, listOk];
    }

    class ActionAll extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { configapp: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ActionAll",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*configapp*/ ctx[0] === undefined && !('configapp' in props)) {
    			console.warn("<ActionAll> was created without expected prop 'configapp'");
    		}
    	}

    	get configapp() {
    		throw new Error("<ActionAll>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set configapp(value) {
    		throw new Error("<ActionAll>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.48.0 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (22:8) {#each fileListValue as element}
    function create_each_block(ctx) {
    	let cardfile;
    	let current;

    	cardfile = new CardFile({
    			props: {
    				typeImg: /*typeToConvert*/ ctx[0],
    				item: /*element*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(cardfile.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(cardfile, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const cardfile_changes = {};
    			if (dirty & /*typeToConvert*/ 1) cardfile_changes.typeImg = /*typeToConvert*/ ctx[0];
    			if (dirty & /*fileListValue*/ 2) cardfile_changes.item = /*element*/ ctx[2];
    			cardfile.$set(cardfile_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cardfile.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cardfile.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(cardfile, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(22:8) {#each fileListValue as element}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let uploadblock;
    	let t1;
    	let actionall;
    	let current;
    	let each_value = /*fileListValue*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	uploadblock = new UploadBlock({
    			props: { configapp: /*typeToConvert*/ ctx[0] },
    			$$inline: true
    		});

    	actionall = new ActionAll({
    			props: { configapp: /*typeToConvert*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			create_component(uploadblock.$$.fragment);
    			t1 = space();
    			create_component(actionall.$$.fragment);
    			attr_dev(div0, "class", "upload-block svelte-10fgmiy");
    			add_location(div0, file, 20, 4, 592);
    			add_location(div1, file, 19, 0, 582);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div0, t0);
    			mount_component(uploadblock, div0, null);
    			append_dev(div1, t1);
    			mount_component(actionall, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*typeToConvert, fileListValue*/ 3) {
    				each_value = /*fileListValue*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, t0);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			const uploadblock_changes = {};
    			if (dirty & /*typeToConvert*/ 1) uploadblock_changes.configapp = /*typeToConvert*/ ctx[0];
    			uploadblock.$set(uploadblock_changes);
    			const actionall_changes = {};
    			if (dirty & /*typeToConvert*/ 1) actionall_changes.configapp = /*typeToConvert*/ ctx[0];
    			actionall.$set(actionall_changes);
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(uploadblock.$$.fragment, local);
    			transition_in(actionall.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(uploadblock.$$.fragment, local);
    			transition_out(actionall.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			destroy_component(uploadblock);
    			destroy_component(actionall);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { typeToConvert } = $$props;
    	console.log(typeToConvert);

    	// export let fileList
    	//let files = fileList
    	let fileListValue;

    	//$: console.log(fileListValue)
    	fileList.subscribe(value => {
    		$$invalidate(1, fileListValue = value);
    	});

    	const writable_props = ['typeToConvert'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('typeToConvert' in $$props) $$invalidate(0, typeToConvert = $$props.typeToConvert);
    	};

    	$$self.$capture_state = () => ({
    		fileList,
    		CardFile,
    		UploadBlock,
    		ActionAll,
    		typeToConvert,
    		fileListValue
    	});

    	$$self.$inject_state = $$props => {
    		if ('typeToConvert' in $$props) $$invalidate(0, typeToConvert = $$props.typeToConvert);
    		if ('fileListValue' in $$props) $$invalidate(1, fileListValue = $$props.fileListValue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [typeToConvert, fileListValue];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { typeToConvert: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*typeToConvert*/ ctx[0] === undefined && !('typeToConvert' in props)) {
    			console_1.warn("<App> was created without expected prop 'typeToConvert'");
    		}
    	}

    	get typeToConvert() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set typeToConvert(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
      target: document.getElementById("app"),
      props: {
        typeToConvert: config
      }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
