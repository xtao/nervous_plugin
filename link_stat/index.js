// configuration
var interval = 5*1000;
var link_field_total_num = 25;
var vm_field_to_post = [
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

    var emit_data = function(link) {
        for (var i = 0; i < link_field_to_post.length; i++)
            axon.emit( 'data',  link['zonename'] + '.link.' + link_field_to_post[i], link[link_field_to_post[i]] );
    }

    var on_exec_complete = function( err, stdout, stderr ) {
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
                emit_data(link);
                link = [];
            }
        }
    };

    //this checks it
    var check_link_stat = function() {
        child_process.exec( 'kstat -m link -p', on_exec_complete );
    };

    setInterval( check_link_stat, interval );
};



