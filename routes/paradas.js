const express = require('express'),
    router = express.Router(),
    axios = require('axios'),
    panel = require('./../helpers/paineis'),
    data = require('./../helpers/date'),
    logo = require('./../helpers/logo'),
    maquinas = require('./../helpers/maquinas'),
    json = require('flatted');

    function getToday(){
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();
        var h = today.getHours(), m = today.getMinutes(), s = today.getSeconds()
        
        if(String(today.getHours()).length < 2){
            h = '0'+String(today.getHours())
        }
        if(String(today.getMinutes()).length < 2){
            m = '0'+String(today.getMinutes())
        }
        if(String(today.getSeconds()).length < 2){
            s = '0'+String(today.getSeconds())
        }
        today = mm + '/' + dd + '/' + yyyy + "  " + h+":"+m+":"+s
        return today;
    }

router
.get('/', (request, response) => {
    axios
    .all([        
        axios.get(`${process.env.API_URL}/idw/rest/injet/paradas/pesquisaParadasByGalpao` ,{params: {cdGalpao:request.session.cfg.galpao}}),
        axios.get(`${process.env.API_URL}/idw/rest/injet/alertas/pesquisaAlertasByGalpao`,{params: {cdGalpao:request.session.cfg.galpao}})
    ])
    .then(axios.spread((paradas, alertas) => {
        let alerta = [], parada = [], pts = [], pts_ = [];
        for (var par = 0; par < paradas.data.paradasGalpao.length;par++ ){
            console.log(paradas.data.paradasGalpao[par])
            parada.push({
                cdPt: paradas.data.paradasGalpao[par].cdInjetora,
                tempo: paradas.data.paradasGalpao[par].tempoParado,
                descricao: paradas.data.paradasGalpao[par].dsParada,
                cor: '#ff0000'
            });
        }
        for (var ale = 0; ale < alertas.data.alertasGalpao.length;ale++ ){

            // FORMATANDO O HORÁRIO
        let formatado = ''
        for (var par = 0; par < paradas.data.paradasGalpao.length;par++ ){
            
            let tempoFormatado = paradas.data.paradasGalpao[par].tempoParado.split(":");

            if( tempoFormatado[0].length < 2 ){
                tempoFormatado[0] = '0'+tempoFormatado[0]
            }
            if( tempoFormatado[1].length < 2 ){
                tempoFormatado[1] = '0'+tempoFormatado[1]
            }
            if( tempoFormatado[2].length < 2 ){
                tempoFormatado[2] = '0'+tempoFormatado[2]
            }

            formatado = tempoFormatado[0]+':'+tempoFormatado[1]+':'+tempoFormatado[2]
         
            parada.push({
                cdPt: paradas.data.paradasGalpao[par].cdInjetora,
                tempo: formatado,
                descricao: paradas.data.paradasGalpao[par].dsParada,
                cor: '#ff0000'
            });
        }

        for (var ale = 0; ale < alertas.data.alertasGalpao.length;ale++ ){
            
            let alertaFormatado = alertas.data.alertasGalpao[ale].tempoAlerta.split(":");
            //console.log('opa : '+alertas.data.alertasGalpao[ale].tempoAlerta)
            if( alertaFormatado[0].length < 2 ){
                alertaFormatado[0] = '0'+alertaFormatado[0]
            }
            if( alertaFormatado[1].length < 2 ){
                alertaFormatado[1] = '0'+alertaFormatado[1]
            }
            if( alertaFormatado[2].length < 2 ){
                alertaFormatado[2] = '0'+alertaFormatado[2]
            }

            formatado = alertaFormatado[0]+':'+alertaFormatado[1]+':'+alertaFormatado[2]
            // FIM DO FORMATANDO
            alerta.push({
                cdPt: alertas.data.alertasGalpao[ale].cdInjetora,
                tempo: alertas.data.alertasGalpao[ale].tempoAlerta,
                descricao: alertas.data.alertasGalpao[ale].dsAlerta,
                cor: '#ff8b16'
            });
            console.log(alertas.data[ale])
        }

        pts = pts.concat(parada, alerta);

        if(typeof request.session.cfg.maquinas === 'string'  ){            
            if (request.session.cfg.maquinas) {
                
                    pts_ = pts_.concat(pts.filter((pt) => {
                        console.log("cdInjetora: " + " " + pt.cdPt + " == " + request.session.cfg.maquinas )
                        if (pt.cdPt === request.session.cfg.maquinas)                             
                        return pt;
                    }));
                pts = pts_;
            }
        }
        if(typeof request.session.cfg.maquinas === 'undefined' || typeof request.session.cfg.maquinas === 'object'  ){            
            if (request.session.cfg.maquinas) {
                request.session.cfg.maquinas.forEach((maquina) => {
  
                    pts_ = pts_.concat(pts.filter((pt) => {
                        console.log("cdInjetora: " + " " + pt.cdPt + " == " + maquina )
                        if (pt.cdPt === maquina)                             
                        return pt;
                    }));
                });
                pts = pts_;
            }
        }

        response.status(200).render('paradas', { pts: pts, secondsTransition: request.session.cfg.tempo_trans, cor_fundo: request.session.cfg.cor_fundo, nextPage: panel.switch(request.baseUrl, request.session.paineis), logo: logo.hasLogo()});

        }
}))
    .catch((err) => {
        console.log('FAIL', err)
      });
});

router.get('/', (request, response, next) => {
    axios
    .get(`${process.env.API_URL}/idw/rest/injet/monitorizacao/turnoAtual`)
    .then(turnoAtual => {
        axios.post(`${process.env.API_URL}/idw/rest/v2/injet/monitorizacao/postosativos`, {
            idTurno: turnoAtual.data.idTurno,
            filtroOp: 0,
            cdGt: request.session.cfg.galpao,
            turnoAtual: true,
            dtReferencia: `${data.day(new Date())}/${data.getMonth(new Date())}/${data.getYear(new Date())}`
        })
        .then(res => {
            let alerta = [], parada = [], pts = [], pts_ = [], listaFiltroPosto = [];
            res.data.pts.forEach(pt => {
                if (pt.icone.caminhoIcone.includes('Parada') || pt.icone.corTriangulo == '#ffc800') {
                    listaFiltroPosto.push({
                        filtroOp: 0,
                        cdCp: '',
                        dtReferencia: `${data.day(new Date())}/${data.getMonth(new Date())}/${data.getYear(new Date())}`,
                        idTurno: turnoAtual.data.idTurno,
                        cdPosto: pt.cdPt,
                        tpId: 1
                    });
                }
            });

            axios.post(`${process.env.API_URL}/idw/rest/injet/monitorizacao/detalheLista`, {
                listaFiltroPosto
            })
            .then(detalheLista => {
                console.log(detalheLista)
                for (let i = 0; i < detalheLista.data.length; i++) {
                    if(detalheLista == null){
                        console.log('Fui')
                    }
                    else{ if(detalheLista.data[i].paradaResumo.dataInicio !== '') {
                        parada.push({
                            cdPt: detalheLista.data[i].cdPt,
                            tempo: data.dhms(`${detalheLista.data[i].paradaResumo.dataInicio} ${detalheLista.data[i].paradaResumo.horaInicio}`),
                            descricao: detalheLista.data[i].paradaResumo.ultimaParada,
                            cor: '#ff0000'
                        });
                    }}

                    if (detalheLista.data[i].alertas != '' && detalheLista.data[i].alertas[detalheLista.data[i].alertas.length - 1].dtHrFim == '') {
                        alerta.push({
                            cdPt: detalheLista.data[i].cdPt,
                            tempo: data.dhms(detalheLista.data[i].alertas[detalheLista.data[i].alertas.length - 1].dtHrInicio),
                            descricao: detalheLista.data[i].alertas[detalheLista.data[i].alertas.length - 1].dsAlerta,
                            cor: '#ff8b16'
                        });
                    }

                }

                pts = pts.concat(parada, alerta);

                if (request.session.cfg.maquinas) {
                    request.session.cfg.maquinas.forEach((maquina) => {
                        pts_ = pts_.concat(pts.filter((pt) => {
                            if (pt.cdPt === maquina) return pt;
                        }));
                    });
                    pts = pts_;
                }

                response.status(200).render('paradas', { pts: pts, secondsTransition: request.session.cfg.tempo_trans, cor_fundo: request.session.cfg.cor_fundo, nextPage: panel.switch(request.baseUrl, request.session.paineis), logo: logo.hasLogo()});
            })
            .catch(errorDetalheLista => response.status(500).render('error', {error: errorDetalheLista}));
        })
        .catch(error => response.status(500).render('error', {error: error}));
    })
    .catch(errorTurnoAtual => response.status(500).render('error', {error: errorTurnoAtual}));
});

module.exports = router;