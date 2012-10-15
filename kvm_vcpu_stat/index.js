// configuration
var interval = 5*1000;
var vcpu_field_total_num = 25;
var vcpu_field_to_post = [
    'exits',
    'fpu-reload',
    'halt-exits',
    'halt-wakeup',
    'host-state-reload',
    'hypercalls',
    'insn-emulation',
    'inst-emulation-fail',
    'invlpg',
    'io-exits',
    'irq-exits',
    'irq-injections',
    'irq-window-exits',
    'mmio-exits',
    'nmi-injections',
    'pf-fixed',
    'pf-guest',
    'request-irq-exits',
    'signal-exits'
];

//deps
var child_process = require('child_process');

//code
//our plugin main function
module.exports = function( axon ) {

    var emit_data = function(cpu) {
        for (var i = 0; i < vcpu_field_to_post.length; i++)
            axon.emit( 'data', cpu['zonename'] + '.vcpu.' + cpu['instance'] + '.' + vcpu_field_to_post[i], virtual_cpu[vcpu_field_to_post[i]] );
    }

    var on_exec_complete = function( err, stdout, stderr ) {
        var virtual_cpu = [];
        var lines = stdout.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var field = lines[i].split(':');
            if (field.length < 4) {
                continue;
            }
            var metric = field[3].split('\t');
            virtual_cpu[metric[0]] = metric[1];
            if (i % vcpu_field_total_num == vcpu_field_total_num - 1) {
                virtual_cpu['instance'] = field[1];
                emit_data(virtual_cpu);
                virtual_cpu = [];
            }
        }
    };

    //this checks it
    var check_kvm_vcpu_stat = function() {
        child_process.exec( 'kstat -m kvm -p -n vcpu*', on_exec_complete );
    };

    setInterval( check_kvm_vcpu_stat, interval );
};



