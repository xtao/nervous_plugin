// configuration
var interval = 5*1000;
var vm_field_total_num = 14;
var vm_field_to_post = [
    'lpages',
    'mmu-cache-miss',
    'mmu-flooded',
    'mmu-pte-updated',
    'mmu-pte-write',
    'mmu-pte-zapped',
    'mmu-recycled',
    'mmu-unsync-page',
    'remote-tlb-flush'
];

//deps
var child_process = require('child_process');

//code
//our plugin main function
module.exports = function( axon ) {

    var emit_data = function(vm) {
        for (var i = 0; i < vm_field_to_post.length; i++)
            axon.emit( 'data',  vm['zonename'] + '.vm.' + vm_field_to_post[i], vm[vm_field_to_post[i]] );
    }

    var on_exec_complete = function( err, stdout, stderr ) {
        var virtual_machine = [];
        var lines = stdout.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var field = lines[i].split(':');
            if (field.length < 4) {
                continue;
            }
            var metric = field[3].split('\t');
            virtual_machine[metric[0]] = metric[1];
            if (i % vm_field_total_num == vm_field_total_num - 1) {
                emit_data(virtual_machine);
                virtual_machine = [];
            }
        }
    };

    //this checks it
    var check_kvm_vm_stat = function() {
        child_process.exec( 'kstat -m kvm -p -n vm', on_exec_complete );
    };

    setInterval( check_kvm_vm_stat, interval );
};



