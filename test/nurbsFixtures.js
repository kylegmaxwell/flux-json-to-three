'use strict';

// Test fixtures for nurbs objects.
// The entity is the geometry to render.
// Center, minRadius and maxRadius are measured properties that should
// not change as long as the shape of the curves is preserved.
exports.tests = [
{
    "name":"closed curve of degree 1",
    "entity": {"degree":1,"knots":[0,0,4.74472190640202,9.48944381280404,14.2341657192061,
        18.9788876256081,18.9788876256081],"controlPoints":[[-56.1434189986318,
        -22.1139992733978,0],[-50.5865151902076,-21.9437193208551,0],[-51.7632712908151,
        -20.283489783564,0],[-54.3782848477206,-20.411199747971,0],[-56.1434189986318,
        -22.1139992733978,0]],"primitive":"curve"},
    "center": [-53.80298186520138,-21.37328147983714,0],
    "minRadius": 1.1209704636992257,
    "maxRadius": 3.2666584152327265
},
{
    "name":"closed curve of degree 2",
    "entity": {"degree":2,"knots":[-8.83622118352474,-8.83622118352474,0,8.83622118352474,
        17.6724423670495,26.5086635505742,35.3448847340989,44.1811059176237,
        44.1811059176237],"controlPoints":[[-58.1173567345709,-13.8409014433673,0],
        [-52.8404214137963,-19.4421152527666,0],[-47.4918563881119,-13.7836155152671,0],
        [-52.9589720821958,-16.7763468179973,0],[-58.1173567345709,-13.8409014433673,0],
        [-52.8404214137963,-19.4421152527666,0]],"primitive":"curve"},
    "center": [-52.905758540781264,-15.97463789185401,0],
    "minRadius": 0.062423555859842106,
    "maxRadius": 4.210775050821636
},
{
    "name":"closed curve of degree 3",
    "entity": {"degree":3,"knots":[-18.4338685865743,-18.4338685865743,-9.21693429328714,0,
        9.21693429328714,18.4338685865743,27.6508028798614,36.8677371731485,
        46.0846714664357,55.3016057597228,64.5185400530099,73.7354743462971,
        82.9524086395842,82.9524086395842],"controlPoints":[[-54.835912220179,
        -8.18905208287618,0],[-56.8625477267808,-14.8573366529851,0],
        [-57.7778024716977,-6.48929327088762,0],[-48.4291290057606,-4.78953445889907,0],
        [-47.3177482440758,-11.7193203846986,0],[-50.521139851285,-7.53529869364981,0],
        [-51.4363945962019,-13.2883285188418,0],[-54.835912220179,-8.18905208287618,0],
        [-56.8625477267808,-14.8573366529851,0],[-57.7778024716977,-6.48929327088762,0]]
        ,"primitive":"curve"},
    "center": [-52.48928233084217,-9.575724525192255,0],
    "minRadius": 1.345784339838084,
    "maxRadius": 5.05717346055825
},
{
    "name":"closed curve of degree 4",
    "entity": {"degree":4,"knots":[-28.1217648361568,-28.1217648361568,-18.7478432241046,
        -9.37392161205228,0,9.37392161205228,18.7478432241046,28.1217648361568,
        37.4956864482091,46.8696080602614,56.2435296723137,65.6174512843659,
        74.9913728964182,84.3652945084705,93.7392161205228,103.113137732575,
        103.113137732575],"controlPoints":[[-52.2026363732446,-2.60499111223872,
        0],[-57.306468399441,-3.46765952045161,0],[-55.0350921775669,
        -1.81006195279022,0],[-58.0379123559841,5.44255074852317,0],
        [-52.0459558703492,-0.0143979978593567,0],[-43.6936819087092,
        6.7131317683175,0],[-51.4815478843299,-2.79378447350203,0],
        [-46.4327572845838,-5.51443086220825,0],[-52.2026363732446,
        -2.60499111223872,0],[-57.306468399441,-3.46765952045161,0],
        [-55.0350921775669,-1.81006195279022,0],[-58.0379123559841,
        5.44255074852317,0]],"primitive":"curve"},
    "center": [-52.05051032243103,-0.5155034491023427,0],
    "minRadius": 2.796812471433096,
    "maxRadius": 6.493607168916989
},
{
    "name":"closed curve of degree 5",
    "entity": {"degree":5,"knots":[-44.1872710305913,-44.1872710305913,-33.1404532729435,
        -22.0936355152956,-11.0468177576478,0,11.0468177576478,22.0936355152956,
        33.1404532729435,44.1872710305913,55.2340887882391,66.280906545887,
        77.3277243035348,88.3745420611826,99.4213598188304,110.468177576478,
        121.514995334126,132.561813091774,143.608630849422,143.608630849422],
        "controlPoints":[[-49.3443837506775,8.70053997218096,0],[-44.768110026093,
        5.51484099015032,0],[-51.7632712908151,5.43714101497883,0],[-51.6325206129698,
        7.69044029495173,0],[-56.3395450153997,5.86449087842197,0],[-59.6083119615315,
        10.7595893142252,0],[-49.6712604452907,14.8388380107278,0],[-55.3589149315601,
        9.1278898356241,0],[-42.2838471470328,9.74948963699593,0],[-49.3443837506775,
        8.70053997218096,0],[-44.768110026093,5.51484099015032,0],[-51.7632712908151,
        5.43714101497883,0],[-51.6325206129698,7.69044029495173,0],[-56.3395450153997,
        5.86449087842197,0]],"primitive":"curve"},
    "center": [-51.19327084542382,8.622012380132777,0],
    "minRadius": 1.6613787646265434,
    "maxRadius": 5.973387984114655
},
{
    "name":"open curve of degree 1",
    "entity": {"degree":1,"knots":[0,0,6.44250067398539,12.8850013479708,12.8850013479708],
        "controlPoints":[[-27.5743958894395,-21.8524979177073,0],[-19.6639798798005,
        -20.8718678338677,0],[-22.3443687756286,-16.7532214817416,0]],
        "primitive":"curve"},
    "center": [-23.194248181622868,-19.825862411105533,0],
    "minRadius": 3.1880114939465973,
    "maxRadius": 4.826276558477591
},
{
    "name":"open curve of degree 2",
    "entity": {"degree":2,"knots":[0,0,0,9.98589672553413,19.9717934510683,19.9717934510683,
        19.9717934510683],"controlPoints":[[-25.3516343660699,-16.4263447871284,0],
        [-20.1869825911816,-9.49655886132891,0],[-17.7027197121214,-14.2035832637588,0],
        [-14.9569554773706,-9.88881089486474,0]],"primitive":"curve"},
    "center": [-19.37319582021751,-12.31314637991252,0],
    "minRadius": 0.6208796520129561,
    "maxRadius": 7.256729882230484
},
{
    "name":"open curve of degree 3",
    "entity": {"degree":3,"knots":[0,0,0,0,7.77848120807509,15.5569624161502,
        23.3354436242253,31.1139248323004,31.1139248323004,31.1139248323004,
        31.1139248323004],"controlPoints":[[-26.5283904666773,-9.30043284456101,0],
        [-24.8286316546888,-4.85490979782171,0],[-23.0634975037776,-10.4771889451685,0],
        [-22.8673714870097,-4.52803310320853,0],[-20.0562319133363,-9.62730953917419,0],
        [-18.6179744570383,-4.92028513674435,0],[-17.3104676785855,-8.45055343856673,
        0]],"primitive":"curve"},
    "center": [-21.971976561437746,-7.253378989808367,0],
    "minRadius": 0.5221824510307846,
    "maxRadius": 4.995131345632271
},
{
    "name":"open curve of degree 4",
    "entity": {"degree":4,"knots":[0,0,0,0,0,8.38590749522425,16.7718149904485,
        25.1577224856727,25.1577224856727,25.1577224856727,25.1577224856727,
        25.1577224856727],"controlPoints":[[-27.7051465672848,-4.52803310320853,0],
        [-26.4630151277547,-1.12851547923142,0],[-24.6978809768435,-4.26653174751798,0],
        [-23.3249988594681,-0.605512767850325,0],[-22.082867419938,-4.07040573075007,0],
        [-20.8407359804079,0.17899129922132,0],[-17.8334703899666,-4.92028513674435,0]],
        "primitive":"curve"},
    "center": [-23.358819865058383,-2.5649373536441744,0],
    "minRadius": 0.12441872342080493,
    "maxRadius": 6.006425725941506
},
{
    "name":"open curve of degree 5",
    "entity": {"degree":5,"knots":[0,0,0,0,0,0,29.0424321726489,58.0848643452978,
        58.0848643452978,58.0848643452978,58.0848643452978,58.0848643452978,
        58.0848643452978],"controlPoints":[[-28.2281492786659,-0.670888106772961,0],
        [-29.0780286846602,8.35090866455091,0],[-24.6325056379209,11.8811769663733,0],
        [-24.6978809768435,-1.25926615707669,0],[-21.9521167420927,15.2153192514278,0],
        [-20.8407359804079,2.33637748366833,0],[-19.3371031851873,12.6656810334449,0]],
        "primitive":"curve"},
    "center": [-24.16117837709702,7.079313024741237,0],
    "minRadius": 0.10902130879484412,
    "maxRadius": 8.75247792874292
},
{
    "name":"open surface of degree 3",
    "entity": {"uDegree":1,"vDegree":3,"uKnots":[0,0,20,20],"vKnots":[-105.464308091522,
        -105.464308091522,-52.7321540457612,0,52.7321540457612,105.464308091522,
        158.196462137284,210.928616183045,263.660770228806,316.392924274567,
        369.125078320329,421.85723236609,474.589386411851,527.321540457612,
        580.053694503374,580.053694503374],"controlPoints":[
        [[-65.6026854944537,-6.42888449093355,0.3],[-65.6026854944537,-6.42888449093355,5.6]],
        [[-68.9643548739377,-4.71074468082081,0.3],[-68.9643548739377,-4.71074468082081,5.6]],
        [[-72.1542614991033,-1.09494281198375,0.3],[-72.1542614991033,-1.09494281198375,5.6]],
        [[-71.1847611722815,0.971411717813915,0.3],[-71.1847611722815,0.971411717813915,5.6]],
        [[-66.8416965430798,1.5136452439929  ,0.3],[-66.8416965430798,1.5136452439929  ,5.6]],
        [[-62.4250888551858,0.559622809576671,0.3],[-62.4250888551858,0.559622809576671,5.6]],
        [[-61.0549968262227,-1.26688512156699,0.3],[-61.0549968262227,-1.26688512156699,5.6]],
        [[-62.0534628243984,-2.84849095170724,0.3],[-62.0534628243984,-2.84849095170724,5.6]],
        [[-62.6027136300126,-4.80905189482115,0.3],[-62.6027136300126,-4.80905189482115,5.6]],
        [[-65.6026854944537,-6.42888449093355,0.3],[-65.6026854944537,-6.42888449093355,5.6]],
        [[-68.9643548739377,-4.71074468082081,0.3],[-68.9643548739377,-4.71074468082081,5.6]],
        [[-72.1542614991033,-1.09494281198375,0.3],[-72.1542614991033,-1.09494281198375,5.6]]],
        "primitive":"surface"},
    "center": [-65.87600446428571,-2.0127038274492537,2.949999958276749],
    "minRadius": 4.1298777770361745,
    "maxRadius": 6.498668777124591
},
{
    "name":"closed surface of degree 5",
    "entity": {"controlPoints":[[[-70.5509146509582,5.86449087842197,0],[-65.8438902485283,
        7.69044029495173,0],[-65.9746409263736,5.43714101497884,0],[-58.9794796616515,
        5.51484099015032,0],[-63.555753386236,8.70053997218096,0],[-56.4952167825913,
        9.74948963699593,0],[-69.5702845671186,9.1278898356241,0],[-63.8826300808492,
        14.8388380107278,0],[-73.81968159709,10.7595893142252,0],[-70.5509146509582,
        5.86449087842197,0],[-65.8438902485283,7.69044029495173,0],[-65.9746409263736,
        5.43714101497884,0],[-58.9794796616515,5.51484099015032,0],[-63.555753386236,
        8.70053997218096,0]],[[-70.5509146509582,5.86449087842197,6.24263307904506],
        [-65.8438902485283,7.69044029495173,6.24263307904506],[-65.9746409263736,
        5.43714101497884,6.24263307904506],[-58.9794796616515,5.51484099015032,
        6.24263307904506],[-63.555753386236,8.70053997218096,6.24263307904506],
        [-56.4952167825913,9.74948963699593,6.24263307904506],[-69.5702845671186,
        9.1278898356241,6.24263307904506],[-63.8826300808492,14.8388380107278,
        6.24263307904506],[-73.81968159709,10.7595893142252,6.24263307904506],
        [-70.5509146509582,5.86449087842197,6.24263307904506],[-65.8438902485283,
        7.69044029495173,6.24263307904506],[-65.9746409263736,5.43714101497884,
        6.24263307904506],[-58.9794796616515,5.51484099015032,6.24263307904506],
        [-63.555753386236,8.70053997218096,6.24263307904506]]],"primitive":"surface",
        "uDegree":5,"uKnots":[-143.608630849422,-143.608630849422,-132.561813091774,
        -121.514995334126,-110.468177576478,-99.4213598188304,-88.3745420611826,
        -77.3277243035348,-66.280906545887,-55.2340887882391,-44.1872710305913,
        -33.1404532729435,-22.0936355152956,-11.0468177576478,0,11.0468177576478,
        22.0936355152956,33.1404532729435,44.1872710305913,44.1872710305913],
        "vDegree":1,"vKnots":[0,0,6.24263307904506,6.24263307904506]},
    "center": [-65.40805439267841,8.631473342009954,3.1213165372610097],
    "minRadius": 1.6539047231078088,
    "maxRadius": 6.735656721944175
}
];