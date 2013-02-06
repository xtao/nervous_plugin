#!/bin/bash


/usr/sbin/dtrace -n '

#pragma D option destructive
#pragma D option quiet

BEGIN

sysinfo:::readch,
sysinfo:::writech
/execname == "qemu-system-x86_"/
{
   /* choose statistic to track */
   this->value = arg0;

   /*
    * Save details
    */
   @out[uid, pid, ppid, execname,
       probename == "readch" ? "R" : "W"] = sum(this->value);

   /* this->ok = 0; */
}

tick-2sec
{
        /* print data */
        printa("%d %d %d %s %s %@d\n", @out);
        /* printf("\n"); */
        trunc(@out);

}
'
