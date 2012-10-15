// configuration
var interval = 5*1000;

//deps
var child_process = require('child_process');

//code
//our plugin main function
module.exports = function( axon ) {

    var on_exec_complete = function( err, stdout, stderr ) {
        var virtual_machine = {}; 
        var virtual_machines = {};
        var lines = stdout.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var field = lines[i].split(':');
            if (field.length < 4) {
                continue;
            }
            var metric = field[3].split('\t');
            virtual_machine[metric[0]] = metric[1]; 
            virtual_machines[field[1]] = virtual_machine;
            if (i % 14 == 13)
                virtual_machine = {};
        }

        for (key in virtual_machines) {
            virtual_machine = virtual_machines[key];
            axon.emit( 'data',  virtual_machine['zonename'] + '.vm.lpages', virtual_machine['lpages'] );
            axon.emit( 'data',  virtual_machine['zonename'] + '.vm.mmu-cache-miss', virtual_machine['mmu-cache-miss'] );
            axon.emit( 'data',  virtual_machine['zonename'] + '.vm.mmu-flooded', virtual_machine['mmu-flooded'] );
            axon.emit( 'data',  virtual_machine['zonename'] + '.vm.mmu-pte-updated', virtual_machine['mmu-pte-updated'] );
            axon.emit( 'data',  virtual_machine['zonename'] + '.vm.mmu-pte-write', virtual_machine['mmu-pte-write'] );
            axon.emit( 'data',  virtual_machine['zonename'] + '.vm.mmu-pte-zapped', virtual_machine['mmu-pte-zapped'] );
            axon.emit( 'data',  virtual_machine['zonename'] + '.vm.mmu-recycled', virtual_machine['mmu-recycled'] );
            axon.emit( 'data',  virtual_machine['zonename'] + '.vm.mmu-unsync-page', virtual_machine['mmu-unsync-page'] );
            axon.emit( 'data',  virtual_machine['zonename'] + '.vm.remote-tlb-flush', virtual_machine['remote-tlb-flush'] );
        }

    };

    //this checks it
    var check_kvm_vm_stat = function() {
        child_process.exec( 'kstat -m kvm -p -n vm', on_exec_complete );
    };

    setInterval( check_kvm_vm_stat, interval );
};



