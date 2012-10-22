// configuration
var interval = 5*1000;
var ZONE_ID    =   0;
var UUID_ID    =   1;
var TYPE_ID    =   2;
var RAM_ID     =   3;
var STATE_ID   =   4;
var PID_ID     =   5;
var ALIAS_ID   =   6;
var vm_list = [];

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

    var emit_data = function(data) {
        axon.emit( 'data',  data['alias'] + '.' + data['name'], data['data'] );
    }

    var on_cpu_complete = function( err, stdout, stderr ) {
        var lines = stdout.split('\n');
        if (lines.length < 4) {
            return;
        }
        for (var i = 0; i < lines.length; i++) {
            var payload = lines[i];
            payload = payload.replace(/[ ]+/g, ' ').replace(/^ /, '').replace(/ $/, '');
            var matches = payload.split(' ');
            if (matches[0] == 'ZONEID') {
                if (i + 1 < lines.length) {
                    var data = [];
                    payload = lines[i + 1];
                    payload = payload.replace(/[ ]+/g, ' ').replace(/^ /, '').replace(/ $/, '');
                    matches = payload.split(' ');
                    var zone_id = matches[0];
                    var zone_memory_usage = matches[4].match(/(.*)%/);
                    var zone_cpu_usage = matches[6].match(/(.*)%/);
                    var zone_uuid = matches[7];
                    zone_info = vm_list[zone_id];
                    data['alias'] = zone_info['alias'];
                    data['name'] = 'memory_usage';
                    data['data'] = zone_memory_usage;
                    emit_data(data);
                    data['name'] = 'cpu_usage';
                    data['data'] = zone_cpu_usage;
                    emit_data(data);
                }
            }
        }
    };

    var emit_link = function(link) {
        for (var i = 0; i < link.length; i++) {
            var data = [];
            zone_id = link['name'].match(/z(\d+)_net/);
            zone_info = vm_list[zone_id];
            data['alias'] = zone_info['alias'];
            for (var i = 0; i < link_field_to_post.length; i++) {
                data['name'] = link['name'] + '.' + link_field_to_post[i];
                data['data'] = link[link_field_to_post[i]];
                emit_data(data);
            }
        }
    }

    var on_link_complete = function( err, stdout, stderr ) {
        var lines = stdout.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var link = [];
            var field = lines[i].split(':');
            if (field.length < 4) {
                continue;
            }
            var metric = field[3].split('\t');
            link[metric[0]] = metric[1];
            if (i % link_field_total_num == link_field_total_num - 1) {
                link['name'] = field[2];
                emit_data(link);
            }
        }
    };

    var on_disk_complete = function( err, stdout, stderr ) {
        var lines = stdout.split('\n');
        for (var i = 1; i < lines.length; i++) {
            var data = [];
            var matches = lines[i].match(/zones\/([a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})-(disk[0-9]+)[ ]+(\d+)/ );
            if (matches == null)
                continue;
            var zone_name = matches[1];
            zone_info = vm_list[zone_name];
            data['alias'] = zone_info['alias'];
            data['name'] = matches[2] + '_used';
            data['data'] = matches[3];
            emit_data(data);
        }
    };

    var on_exec_complete = function( err, stdout, stderr ) {
        var lines = stdout.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var field = lines[i].split(':');
            if (field.length < 6) {
                continue;
            }
            if (field[TYPE_ID] != 'KVM') {
                continue;
            }
            vm_list[field[ZONE_ID]] = field;
            vm_list[field[UUID_ID]] = field;
            child_process.exec( 'prstat -z' + field[ZONE_ID]  + ' -p -Z 1 1', on_cpu_complete);
            child_process.exec( 'kstat -m link -n z' + ZONE_ID  + '_net* -p', on_link_complete);
            child_process.exec( 'zfs list -p -o name,used', on_disk_complete );
        }
    };

    //this checks it
    var check_vm_usage = function() {
        child_process.exec( 'vmadm list -p -o zoneid,uuid,type,ram,state,pid,alias|grep :KVM:', on_exec_complete );
    };

    setInterval( check_vm_usage, interval );
};
