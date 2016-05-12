var term;
var socket = io(location.origin, {path: '/wetty/socket.io'})
var buf = '';

function Wetty(argv) {
    this.argv_ = argv;
    this.io = null;
    this.pid_ = -1;
}

Wetty.prototype.run = function() {
    this.io = this.argv_.io.push();

    this.io.onVTKeystroke = this.sendString_.bind(this);
    this.io.sendString = this.sendString_.bind(this);
    this.io.onTerminalResize = this.onTerminalResize.bind(this);
}

Wetty.prototype.sendString_ = function(str) {
    socket.emit('input', str);
};

Wetty.prototype.onTerminalResize = function(col, row) {
    socket.emit('resize', { col: col, row: row });
};

socket.on('connect', function() {
    lib.init(function() {
        hterm.defaultStorage = new lib.Storage.Local();
        term = new hterm.Terminal();
        window.term = term;
        term.decorate(document.getElementById('terminal'));

        term.setCursorPosition(0, 0);
        term.setCursorVisible(true);
        term.prefs_.set('ctrl-c-copy', true);
        term.prefs_.set('ctrl-v-paste', true);
        term.prefs_.set('use-default-window-copy', true);
        
        term.prefs_.resetAll();
        term.prefs_.set('enable-bold', true);
        term.prefs_.set('enable-bold-as-bright', false);
        
        term.prefs_.set('background-color', '#002b36');
        term.prefs_.set('background-image', '-webkit-linear-gradient(black, rgba(0, 43, 54, 1))');
        term.prefs_.set('foreground-color', '#839496');
        term.prefs_.set('cursor-color', 'rgba(131, 148, 150, 0.5)');
        
        term.prefs_.set('color-palette-overrides', ['#073642', '#dc322f',
            '#859900', '#b58900', '#268bd2', '#d33682', '#2aa198', '#eee8d5',
            '#002b36', '#cb4b16', '#586e75', '#657b83', '#839496', '#6c71c4',
            '#93a1a1', '#fdf6e3']);
        
        term.prefs_.set('font-family', ('"Source Code Pro", ' +
                             '"DejaVu Sans Mono", "Everson Mono", ' +
                             '"FreeMono", "Menlo", "Terminal", ' +
                             'monospace'));
        term.prefs_.set('font-size', 12);
        
        term.prefs_.set('font-smoothing', 'subpixel-antialiased');
        term.prefs_.set('cursor-blink', true);
        term.prefs_.set('scrollbar-visible', false);

        term.runCommandClass(Wetty, document.location.hash.substr(1));
        socket.emit('resize', {
            col: term.screenSize.width,
            row: term.screenSize.height
        });

        if (buf && buf != '')
        {
            term.io.writeUTF16(buf);
            buf = '';
        }
    });
});

socket.on('output', function(data) {
    if (!term) {
        buf += data;
        return;
    }
    term.io.writeUTF16(data);
});

socket.on('disconnect', function() {
    console.log("Socket.io connection closed");
});
