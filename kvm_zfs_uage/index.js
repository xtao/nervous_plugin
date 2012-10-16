// configuration
var interval = 5*1000;

//deps
var child_process = require('child_process');

//code
//our plugin main function
module.exports = function( axon ) {

    var emit_data = function(zfs) {
        axon.emit( 'data',  zfs['zonename'] + '.zfs.' + zfs['disk'] + '.used', zfs['used'] );
    }

    var on_exec_complete = function( err, stdout, stderr ) {
        var lines = stdout.split('\n');
        for (var i = 1; i < lines.length; i++) {
            var zfs = [];
            var matches = lines[i].match(/zones\/([a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})-(disk[0-9]+)[ ]+(\d+)/ );
            if (matches == null)
                continue;
            zfs['zonename'] = matches[1];
            zfs['disk'] = matches[2];
            zfs['used'] = matches[3];
            emit_data(zfs);
        }
    };

    //this checks it
    var check_zfs_usage = function() {
        child_process.exec( 'zfs list -p -o name,used', on_exec_complete );
    };

    setInterval( check_zfs_usage, interval );
};
