/* global document */

'use strict';

var Marionette = require('backbone.marionette'),
    $ = require('jquery'),
    _ = require('underscore'),
    lookup = require('./lib/hotkey-lookup'),
    Hotkeys;

Hotkeys = Marionette.Behavior.extend({
    defaults: {
        hotkeys: {},
        attachToDocument: false
    },
    events: function() {
        var events = {};
        if (!this.options.attachToDocument) {
            events = { 'keydown': '_processHotkeys' };
        }
        return events;
    },
    initialize: function() {
        var errorMessage;

        if (!_.isObject(this.options.hotkeys)) {
            errorMessage = 'behave-ui-hotkeys :: hotkeys option must be an object';
            throw new Error(errorMessage);
        }

        this.hotkeys = [];
        _(this.options.hotkeys).each(this._buildHotkeyCache.bind(this));
    },
    onAttach: function() {
        if (this.options.attachToDocument) {
            $(document).on('keypress', this._processHotkeys.bind(this));
        }

        // make non-focusable elements focusable
        if (!/(input|textarea)/.test(this.view.el.tag.toLowerCase())) {
            this.view.$el
                .attr('tabindex', 0)
                .css('outline', '0px solid transparent');
        }
    },
    _processHotkeys: function(e) {
        var data = {
            code: e.which,
            cmd: e.metaKey,
            ctrl: e.ctrlKey,
            alt: e.altKey,
            shift: e.shiftKey
        };

        _.chain(this.hotkeys)
            .filter(function(hk) {
                return data.code === hk.code &&
                            data.cmd === hk.cmd &&
                            data.ctrl === hk.ctrl &&
                            data.alt === hk.alt &&
                            data.shift === hk.shift;
            }.bind(this))
            .each(function(hk) {
                this.view.trigger('hotkey:' + hk.hotkey);
                if (this.view[hk.method]) this.view[hk.method](e);
            }.bind(this));
    },
    _buildHotkeyCache: function(method, hotkey) {
        var cmd = false,
            ctrl = false,
            alt = false,
            shift = false,
            errorMessage = 'behave-ui-hotkeys :: invalid hotkey(s)',
            code;

        hotkey = hotkey.toLowerCase().trim();
        _(hotkey.split(':')).each(function(k) {
            switch (k) {
                case 'cmd':
                    cmd = true;
                    break;
                case 'ctrl':
                    ctrl = true;
                    break;
                case 'alt':
                    alt = true;
                    break;
                case 'shift':
                    shift = true;
                    break;
                default:
                    code = lookup(k);
                    break;
            }
        });

        this.hotkeys.push({
            hotkey: hotkey,
            method: method,
            code: code,
            cmd: cmd,
            ctrl: ctrl,
            alt: alt,
            shift: shift
        });
    },
    onBeforeDestroy: function() {
        if (this.options.attachToDocument) {
            $(document).off('keypress', this._processHotkeys.bind(this));
        }
    }
});

module.exports = Hotkeys;
