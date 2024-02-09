// the node program that captures local performance data
// and sends it via socket to the server 
// req:

const os = require('os');
const io = require('socket.io-client');
const options = {
    auth: {
        token: '23wdxsaxsa23wadsdssa'
    }
}
const socket = io('https://cluster-servers.onrender.com', options) // 3000 is where our server is listening

socket.on('connect', () => {
    console.log('we connected to the server')

    // we need a way to identify this machine to the server, for front-end usage

    // we could user, socket.id, randomHash? ipAddress? 

    // what about macA? 
    const nI = os.networkInterfaces(); // a list of all network interfaces on this machine 
    let macA; // get mac address
    // loop through all the nI for this machine and find a non-internal one
    for (let key in nI) {
        if (!nI[key][0].internal) {
            macA = nI[key][0].mac + Math.floor(Math.random() * 1000000);
            break;
        }
    }
    console.log(macA, 'macA')
    const perfDataInterval = setInterval(async ()=>{
        const perfData =  await  performanceLoadData();
        perfData.macA = macA;
        socket.emit('perfData', perfData)
    }, 1000)


    socket.on('disconnect', () => {
        clearInterval(perfDataInterval) // if we disconnect, stop sending data
        // console.log('disconnected from server')
    })
});

const  getCPULoad =()=>{

    return new Promise((resolve, reject) => {
        const start = cpuAverage(); // "now" value of load
        setTimeout(() => {
            const end = cpuAverage();
            const idleDifference = end.idle - start.idle;
            const totalDifference = end.total - start.total;
            // calc the % of used cpu
            const percentageCPU = 100 - Math.floor(100 * idleDifference / totalDifference);
            resolve(percentageCPU);
        }, 100);
    });
}

const performanceLoadData = async ()=> new Promise(async (resolve, reject) => {





// what we need to know from node about the operating system performance?
// CPU load (current)
const cpus = os.cpus();
// Memory usage (free, total)
  // - total
  const totalMem = os.totalmem();
  // - free
  const freeMem = os.freemem();
  //- memory usage
    const usedMem = totalMem - freeMem;
    const memUsage = Math.floor(usedMem / totalMem * 100) / 100; // 2 decimal places 
 
// OS Type
const osType = os.type()=== 'Darwin' ? 'Mac' : os.type();

// uptime
const uptime    = os.uptime();

// CPU info

  // - Type
  const cpuType = cpus[0].model;

  // - Number of Cores
    const numCores = cpus.length;
  // - Clock Speed
    const cpuSpeed = cpus[0].speed;
    const cpuLoad = await getCPULoad();
    resolve ({
        freeMem,
        totalMem,
        usedMem,
        memUsage,
        osType,
        uptime,
        cpuType,
        numCores,
        cpuSpeed,
        cpuLoad
        
    

    })
});


    function cpuAverage(){
        const cpus = os.cpus();
        // get ms in each mode, BUT this number is since reboot
        // so get it now, and get it in 100ms and compare
        let idleMs = 0;
        let totalMs = 0;
        // loop through each core
        cpus.forEach((aCore) => {
            // loop through each property of the current core (thread)
            for(mode in aCore.times){
            totalMs += aCore.times[mode];
            }
            idleMs += aCore.times.idle;
        });
        return {
            idle: idleMs / cpus.length,
            total: totalMs / cpus.length
        }
    }
 




performanceLoadData().then((data) => {
    console.log(data)
})
