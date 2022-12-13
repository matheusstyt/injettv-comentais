var Service = require('node-windows').Service;

var svc = new Service({
  name:'InjetTv Web',
  description: 'Dashboard do InjetTv-Web',
  script: 'C:\\Program Files (x86)\\MAP Cardoso\\InjetTv\\bin\\www'
});

svc.on('install',function(){
  svc.start();
});

svc.install();