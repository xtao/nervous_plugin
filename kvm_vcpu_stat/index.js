// configuration
var interval = 5*1000;

//deps
var child_process = require('child_process');

//code
//our plugin main function
module.exports = function( axon ) {

    var on_exec_complete = function( err, stdout, stderr ) {
        var virtual_cpu = [];
        var virtual_instance = [];
        var virtual_machine = [];
        var virtual_cpus = [];
        var lines = stdout.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var field = lines[i].split(':');
            if (field.length < 4) {
                continue;
            }
            var metric = field[3].split('\t');
            virtual_cpu[metric[0]] = metric[1];
            if (i % 25 == 24) {
                virtual_machine[field[2]] = virtual_cpu;
                virtual_instance[field[1]] = virtual_machine;
                virtual_cpus[field[2]+'-'+field[1]] = virtual_instance;
                virtual_cpu = [];
                virtual_machine = [];
                virtual_instance = [];
            }
        }

        //console.log(virtual_cpus);
        for (key in virtual_cpus) {
            virtual_instance = virtual_cpus[key];
            for (instance in virtual_instance) {
                virtual_machine = virtual_instance[instance];
                for (cpu in virtual_machine) {
                virtual_cpu = virtual_machine[cpu];
                axon.emit( 'data',  virtual_cpu['zonename'] + '.vcpu.' + instance + '.exits', virtual_cpu['exits'] );
                }
            }
        }

    };

    //this checks it
    var check_kvm_vcpu_stat = function() {
        child_process.exec( 'kstat -m kvm -p -n vcpu*', on_exec_complete );
    };

    setInterval( check_kvm_vcpu_stat, interval );
};



