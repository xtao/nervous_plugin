#!/usr/bin/env node

child_process = require 'child_process'

module.exports = (axon) ->
    dtrace_io_cmd = "/Users/subdragon/Code/dtrace-io/mock-d.bash"
    vmadm_cmd = "/Users/subdragon/Code/dtrace-io/mock-vmadm.bash"
    INTERVAL = 5

    iod = child_process.spawn dtrace_io_cmd

    parse_vmadm = (vmadm) ->
        vmadm_map = {}
        for line in vmadm.split('\n')
            line = line.trim()
            if line
                items = line.split(":")
                pid = items[0]
                alias = items[1]
                vmadm_map[pid] = alias
        return vmadm_map

    iod.stdout.on 'data', (io_data) ->
        child_process.exec vmadm_cmd, (err, vmadm_out, stderr) ->
            ##console.log "========================"
            lines = io_data.toString().split('\n')
            vmadm_map = parse_vmadm vmadm_out

            for line in lines
                line = line.trim()
                if line
                    items = line.split(" ")

                    alias = vmadm_map[items[1]]
                    if alias
                        alias = alias.replace(/\ /g, "")
                        flag = items[items.length - 2]
                        value = Math.floor(items[items.length - 1]/INTERVAL)
                        if flag == "R"
                            axon.emit('data', alias+"."+"read", value)
                        else
                            axon.emit('data', alias+"."+"write", value)
                    ##else
                    ##    console.log "alias not found ", items[1], vmadm_map
