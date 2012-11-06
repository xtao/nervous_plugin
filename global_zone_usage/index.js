// configuration
var interval = 15*1000;

var link_field_total_num = 25;
var link_field_to_post = [
    'obytes',
    'obytes64',
    'rbytes',
    'rbytes64'
];

//deps
var child_process = require('child_process');

//code
//our plugin main function
module.exports = function( axon ) {

    var emit_link = function(link) {
        for (var i = 0; i < link_field_to_post.length; i++)
            axon.emit( 'data',  'link.' + link['name'] + '.' + link_field_to_post[i], link[link_field_to_post[i]] );
    }

    var on_link_complete = function( err, stdout, stderr ) {
        var link = [];
        var lines = stdout.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var field = lines[i].split(':');
            if (field.length < 4) {
                continue;
            }
            var metric = field[3].split('\t');
            link[metric[0]] = metric[1];
            if (i % link_field_total_num == link_field_total_num - 1) {
                link['name'] = field[2];
                emit_link(link);
                link = [];
            }
        }
    };

    var on_load_avg_complete = function( err, stdout, stderr ) {
        var lines = stdout.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var matches = lines[i].match(/load average: (.*?), (.*?), (.*?)/);
            if (matches === null) {
                continue;
            }
            var metric = matches[1];
            axon.emit( 'data',  'load.avg', metric );
        }
    };

    var on_load_complete = function( err, stdout, stderr ) {
        /* r id free swap sr w */
        var KTHR_R_ID = 0;
        var MEMORY_FREE_ID = 4;
        var CPU_ID_ID = 21;
        var lines = stdout.split('\n');
        if (lines.length < 3) {
            return;
        }
        for (var i = 2; i < lines.length; i++) {
            var payload = lines[i];
            payload = payload.replace(/[ ]+/g, ' ').replace(/^ /, '').replace(/ $/, '');
            var field = payload.split(' ');
            if (field.length < 21) {
                continue;
            }
            var runqueue = field[KTHR_R_ID];
            var idle = field[CPU_ID_ID];
            var free = field[MEMORY_FREE_ID];
            axon.emit( 'data',  'load.runqueue', runqueue );
            axon.emit( 'data',  'load.idle', idle );
            axon.emit( 'data',  'load.free', free );
        }
    };

    var on_io_complete = function( err, stdout, stderr ) {
        /* %b wait*/
        var R_S_ID = 0;
        var W_S_ID = 1;
        var KR_S_ID = 2;
        var KW_S_ID = 3;
        var WAIT_ID = 4;
        var B_ID = 9;
        var DEVICE_ID = 10;
        var lines = stdout.split('\n');
        if (lines.length < 3) {
            return;
        }
        for (var i = 2; i < lines.length; i++) {
            var payload = lines[i];
            payload = payload.replace(/[ ]+/g, ' ').replace(/^ /, '').replace(/ $/, '');
            var field = payload.split(' ');
            if (field.length < 11) {
                continue;
            }
            var device = field[DEVICE_ID];
            var wait = field[WAIT_ID];
            var busy = field[B_ID];
            var read = field[R_S_ID];
            var write = field[W_S_ID];
            var kread = field[KR_S_ID];
            var kwrite = field[KW_S_ID];
            axon.emit( 'data',  'io.' + device + '.wait', wait );
            axon.emit( 'data',  'io.' + device + '.busy', busy );
            axon.emit( 'data',  'io.' + device + '.read', read );
            axon.emit( 'data',  'io.' + device + '.write', write );
            axon.emit( 'data',  'io.' + device + '.kread', kread );
            axon.emit( 'data',  'io.' + device + '.kwrite', kwrite );
        }

    };

    var on_df_complete = function( err, stdout, stderr ) {
        var FILE_SYSTEM_ID = 0;
        var KBYTES_ID = 1;
        var USED_ID = 2;
        var AVAIL_ID = 3;
        var CAPACITY_ID = 4;
        var lines = stdout.split('\n');
        if (lines.length < 2) {
            return;
        }
        for (var i = 1; i < lines.length; i++) {
            var payload = lines[i];
            payload = payload.replace(/[ ]+/g, ' ').replace(/^ /, '').replace(/ $/, '');
            var field = payload.split(' ');
            if (field.length < 5) {
                continue;
            }
            var used = field[USED_ID];
            var avail = field[AVAIL_ID];
            var matches = field[CAPACITY_ID].match(/()%/);
            if (matches === null) {
                continue;
            }
            var cap = matches[1];
            axon.emit( 'data',  'zones.used', used );
            axon.emit( 'data',  'zones.avail', avail );
            axon.emit( 'data',  'zones.capacity', cap );
        }
    };

    //this checks it
    var check_global_zone_usage = function() {
        child_process.exec( 'uptime ', on_load_avg_complete);
        child_process.exec( 'vmstat 1 1 ', on_load_complete);
        child_process.exec( 'iostat -xn 1 1 ', on_io_complete);
        child_process.exec( 'df -k zones', on_df_complete);
        child_process.exec( 'kstat -m link -n igb* -p', on_link_complete );
    };

    setInterval( check_global_zone_usage, interval );
};



