const express = require('express'),
    router = express.Router(),
    axios = require('axios'),
    panel = require('./../helpers/paineis'),
    data = require('./../helpers/date'),
    logo = require('./../helpers/logo'),
    json = require('flatted')

var turnoAtualVar;
const ip = "http://170.10.0.208:8080";
const dataTeste = "2020-01-21";

var contador = 0;
var velocimetroGlobal;
var biGlobal;
var turnoGlobal;
var ultimaAtualizacao;
var globalRequest;

function retornaMes(){

        if (data.getMonth(new Date()) < 10){

            return "0" + data.getMonth(new Date())
        } else{

            return data.getMonth(new Date())
        }
}

function getToday(){
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    today = mm + '/' + dd + '/' + yyyy + "  " + today.getHours()+":"+today.getMinutes()+":"+today.getSeconds()
    
    return today;
}

        router
        .get('/', (request, response, next) => {
            // if(contador == 0) { 
            
            //     // globalRequest = request;

            //     setInterval(function(){  
            //         produtividadeTask(request);
            //     }, 150000);
            
                function lastDayOfMonth(ano, mes) {
                    return new Date(ano, mes, 0).getDate();
                }
                axios
                .get(ip+`/idw/rest/injet/monitorizacao/turnoAtual`)
                .then(turnoAtual => {
                    var diaReferencia = turnoAtual.data.dtReferencia.slice(0, 2);
                    var mesReferencia = turnoAtual.data.dtReferencia.slice(3, 5);
                    var anoReferencia = turnoAtual.data.dtReferencia.slice(6, 10);

                    console.log(anoReferencia + "-" + mesReferencia +  "-" + diaReferencia);
                    console.log("ultimo dia do mes " + lastDayOfMonth(anoReferencia, mesReferencia));
                    console.log(data.getYear(new Date()) + "-" + retornaMes() +  "-" + lastDayOfMonth(anoReferencia, mesReferencia));

                    console.log("Fez chamada de produtividade na pela primeira vez as " + getToday());
                   
                    console.log("Iniciando Chamada pela primeira vez");
                    // console.log(retornaMes())
                    // console.log(`${data.getYear(new Date())}-`+ retornaMes() +`-${data.day(new Date())}`)
                    // console.log(`${data.getYear(new Date())}-${data.getMonth(new Date())}-${data.day(new Date())}`)
                    console.log('request.session.cfg.galpao');
					console.log(request);
					console.log('request.session aquii');
					console.log(request.session);
                    console.log('turnoAtual.data.cdTurno');
					console.log(turnoAtual.data.cdTurno)
                    turnoAtualVar = turnoAtual.data.cdTurno
					
					setTimeout(() => {
						axios
						.all([
							axios.post(ip+`/idw/rest/injet/bi/resumoBI`, {
								cdGalpao: request.session.cfg.galpao,
								agrupamentoBI: 2,
								cdTurno: turnoAtual.data.cdTurno,
								// dtIni: dataTeste,
								// dtFim: dataTeste
								// dtIni: data.getYear(new Date()) + "-" + retornaMes() +  "-" + data.day(new Date()),
								// dtFim: data.getYear(new Date()) + "-" + retornaMes() +  "-" + data.day(new Date())
								dtIni: anoReferencia + "-" + mesReferencia +  "-" + diaReferencia,
								dtFim: anoReferencia + "-" + mesReferencia +  "-" + diaReferencia,
							}),
							axios.post(ip+`/idw/rest/injet/bi/resumoBI`, {                
								// anoIni: data.getYear(new Date()),
								// mesIni: retornaMes(),
								// anoFim: data.getYear(new Date()),
								// mesFim: retornaMes(),
								dtIni: anoReferencia + "-" + mesReferencia +  "-" + "01",
								dtFim: anoReferencia + "-" + mesReferencia +  "-" + lastDayOfMonth(anoReferencia, mesReferencia),
								cdGalpao: request.session.cfg.galpao,
								agrupamentoBI: 1,
							}),
							axios.get(ip+`/idw/rest/injet/monitorizacao/turnos`)
						])
						.then(axios.spread((velocimetro, bi, turnos) => {       
							
							contador++;      
							velocimetroGlobal = velocimetro;
							biGlobal = bi;
							turnoGlobal = turnos;
							ultimaAtualizacao = getToday();
						   
							console.log("Chamada original "  + velocimetro.data);

							response.status(200).render('produtividade', {
								velocimetro: velocimetro.data,
								bi: bi.data,
								turnos: turnos.data.turnos,
								galpao : request.session.cfg.dsGt,
								secondsTransition: request.session.cfg.tempo_trans,
								cor_fundo: request.session.cfg.cor_fundo,
								nextPage: panel.switch(request.baseUrl, request.session.paineis),
								logo: logo.hasLogo(),
								ultimaAtualizacao : getToday()
							});

							
						   
							
						}))
						.catch(errorBI => response.status(500).render('errorBI', {error: json.stringify(errorBI)}));
					}, 3000);
					
                })
                .catch(errorTurnoAtual => response.status(500).render('errorTurnoAtual', {error: json.stringify(errorTurnoAtual)}));
    
            
            // }else{

            //     globalRequest = request;
              
            //     response.status(200).render('produtividade', {
            //         velocimetro: velocimetroGlobal.data,
            //         bi: biGlobal.data,
            //         turnos: turnoGlobal.data.turnos,
            //         galpao : request.session.cfg.galpao,
            //         secondsTransition: request.session.cfg.tempo_trans,
            //         cor_fundo: request.session.cfg.cor_fundo,
            //         nextPage: panel.switch(request.baseUrl, request.session.paineis),
            //         logo: logo.hasLogo(),
            //         ultimaAtualizacao : ultimaAtualizacao
            //     });

            // }           

        });


async function produtividadeTask(request){   
    console.log("Fez chamada de produtividade na thread as " + getToday());
    await axios
    .get(`${process.env.API_URL}/idw/rest/injet/monitorizacao/turnoAtual`)
    .then(turnoAtual => {   
                console.log("entrou no metodo task");
                axios
                .all([
                    axios.post(`${process.env.API_URL}/idw/rest/injet/bi/resumoBI`, {
                        cdGalpao: request.session.cfg.galpao,
                        agrupamentoBI: 2,
                        cdTurno: turnoAtual.data.cdTurno,                            
                        dtIni: data.getYear(new Date()) + "-" + retornaMes() +  "-" + data.day(new Date()),
                        dtFim: data.getYear(new Date()) + "-" + retornaMes() +  "-" + data.day(new Date())
                    }),
                    axios.post(`${process.env.API_URL}/idw/rest/injet/bi/resumoBI`, {                
                        anoIni: data.getYear(new Date()),
                        mesIni: retornaMes(),
                        anoFim: data.getYear(new Date()),
                        mesFim: retornaMes(),
                        cdGalpao: request.session.cfg.galpao,
                        agrupamentoBI: 1,
                    }),
                    axios.get(`${process.env.API_URL}/idw/rest/injet/monitorizacao/turnos`)
                ])
                .then(axios.spread((velocimetro, bi, turnos) => {
                                         
                        velocimetroGlobal = velocimetro;
                        biGlobal = bi;
                        galpao = request.session.cfg.dsGt,
                        turnoGlobal = turnos;  
                        ultimaAtualizacao = getToday();
                  
                    console.log("passou pelo metodo task");

                }))
                .catch(errorBI => console.log(errorBI));
            })
            .catch(errorTurnoAtual => console.log(errorTurnoAtual));
    
}    



module.exports = router;

