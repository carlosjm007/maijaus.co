
Number.prototype.toFixedDown = function(digits) {
    const expDigits = Math.pow(10, digits);
    const val = this.valueOf() * expDigits;
    return Math[val < 0 ? 'ceil' : 'floor'](val) / expDigits;
};

export const dataToGridMap = (dataFromFile, spects, AREA_SELECTED, STEPS) => {
    const dataVenta = dataFromFile.filter((item) => {
        if (item?.price === 0) return false;
        if (item?.area === 0) return false;
        if (item?.lat === 0) return false;
        if (item?.lat > AREA_SELECTED.maxLat) return false;
        if (item?.lat < AREA_SELECTED.minLat) return false;
        if (item?.lng === 0) return false;
        if (item?.lng < AREA_SELECTED.minLng) return false;
        if (item?.lng > AREA_SELECTED.maxLng) return false;
        return true;
    });
    console.log("dataVenta", dataVenta.length);

    // get max and min price
    let maxVenta = dataVenta.reduce((max, p) => (p.price/p.area) > max ? (p.price/p.area) : max, (dataFromFile[0].price/(dataFromFile[0].area)));
    let minVenta = dataVenta.reduce((min, p) => (p.price/p.area) < min ? (p.price/p.area) : min, (dataFromFile[0].price/(dataFromFile[0].area)));
    console.log("maxVenta", maxVenta, "minVenta", minVenta);


    let maxLng = dataVenta.reduce((max, p) => p.lng > max ? p.lng : max, dataFromFile[0].lng);
    let minLng = dataVenta.reduce((min, p) => p.lng < min ? p.lng : min, dataFromFile[0].lng);
    
    console.log("maxLng", maxLng, "minLng", minLng);


    let maxLat = dataVenta.reduce((max, p) => p.lat > max ? p.lat : max, dataFromFile[0].lat);
    let minLat = dataVenta.reduce((min, p) => p.lat < min ? p.lat : min, dataFromFile[0].lat);
    
    console.log("maxLat", maxLat, "minLat", minLat);

    const MATRIZ_VENTAS = [];

    for (let i = AREA_SELECTED.minLat; i < AREA_SELECTED.maxLat; i = i + STEPS.lat) {
        for(let j = AREA_SELECTED.minLng; j < AREA_SELECTED.maxLng; j = j + STEPS.lng){
        MATRIZ_VENTAS.push({
            lat: i,
            lng: j,
            c: [],
        });
        }
    }

    let allVentas = [];
    dataVenta.forEach((item) => {
        allVentas.push(item.price / item.area);
    });
    // removing 3 quartiles
    allVentas = allVentas.sort((a, b) => a - b);
    allVentas = allVentas.slice(0, Math.floor(allVentas.length * 0.9));
    allVentas = allVentas.slice(Math.floor(allVentas.length * 0.1), allVentas.length);
    // get max and min price
    maxVenta = allVentas.reduce((max, p) => p > max ? p : max, allVentas[0]);
    minVenta = allVentas.reduce((min, p) => p < min ? p : min, allVentas[0]);

    dataVenta.forEach((item) => {
        const celda = MATRIZ_VENTAS.find((matriz) => {
        if (!(item.lat > matriz.lat && item.lat < matriz.lat + STEPS.lat)) {
            return false;
        }
        if (!(item.lng > matriz.lng && item.lng < matriz.lng + STEPS.lng)) {
            return false;
        }
        return true;
        });
        if (!celda) return;
        const meter_price = item.price / item.area;
        if(meter_price > maxVenta) return;
        if(meter_price < minVenta) return;
        celda.c.push(meter_price);
    });

    let matriz_final = MATRIZ_VENTAS.filter((item) => item.c.length > 0).map((item) => {
        const mean = item.c.reduce((a, b) => a + b, 0) / item.c.length;
        return {
        l: [item.lat.toFixedDown(5), item.lng.toFixedDown(5)],
        c: mean,
        }
    });

    //get max and min price
    let maxPrice = matriz_final.reduce((max, p) => p.c > max ? p.c : max, matriz_final[0].c);
    let minPrice = matriz_final.reduce((min, p) => p.c < min ? p.c : min, matriz_final[0].c);
    console.log("maxPrice", maxPrice, "minPrice", minPrice);

    const M = spects.highQuantile/(maxPrice - minPrice);
    const B = spects.lowQuantile - (spects.highQuantile/(maxPrice - minPrice)*minPrice);
    matriz_final = matriz_final.map((item) => {
        const normalized = M*item.c + B;
        // return {
        //     ...item,
        //     mean: (item.c/1000000).toFixedDown(1),
        //     c: normalized.toFixedDown(2),
        // }
        return {
            ...item,
            mean: item.c,
            c: normalized.toFixedDown(2),
        }
    });
    return {
        matriz_final, 
        maxCost: maxVenta,
        minCost: minVenta
    };
}

export const mergeArriendoIntoVentas = (matriz_final_venta, matriz_final_arriendo) => {
    if(!matriz_final_arriendo){
        return matriz_final_venta;
    }
    const matriz_final = matriz_final_venta.map((item) => {
        const arriendo = matriz_final_arriendo.find((item2) => item2.l[0] === item.l[0] && item2.l[1] === item.l[1]);
        if(!arriendo) return {
            ...item,
            mean: (item.mean/1000000).toFixedDown(1),       //En millones
            c: item.c,
            arriendo: null
        };
        arriendo.done = true;        
        return {
            ...item,
            mean: (item.mean/1000000).toFixedDown(1),       //En millones
            c: item.c,
            arriendo: (arriendo.mean/1000).toFixedDown(0),  //En miles
        }
    });
    matriz_final_arriendo.forEach((item) => {
        if(item.done) return;
        matriz_final.push({
            l: item.l,
            c: 0,
            arriendo: (item.mean/1000).toFixedDown(0),  //En miles
        });
    });
    return matriz_final;
}