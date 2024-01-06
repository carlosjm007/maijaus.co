import Head from 'next/head'
import styles from '@/styles/Home.module.css';
import Map from '@components/Map';
import Layout from '@components/Layout';
import React, { useState, useEffect, useRef } from 'react';

const SPECTS_LOCATION_LINK = "https://maijaus.z20.web.core.windows.net";

Number.prototype.toFixedDown = function(digits) {
  const expDigits = Math.pow(10, digits);
  const val = this.valueOf() * expDigits;
  return Math[val < 0 ? 'ceil' : 'floor'](val) / expDigits;
};

export async function getStaticProps({params}) {
  const CITY = params.slug?.[0] || "villavicencio";
  let res = await fetch(`${SPECTS_LOCATION_LINK}/${CITY}/venta.json`);
  const venta = await res.json();
  res = await fetch(`${SPECTS_LOCATION_LINK}/${CITY}/spects.json`);
  const spects = await res.json();


  const AREA_SELECTED = {
    minLat: spects.minLat,
    maxLat: spects.maxLat,
    minLng: spects.minLng,
    maxLng: spects.maxLng,
  };

  const STEPS = {
    lat: (AREA_SELECTED.maxLat - AREA_SELECTED.minLat) / spects.step,
    lng: (AREA_SELECTED.maxLng - AREA_SELECTED.minLng) / spects.step,
  };

  const dataVenta = venta.filter((item) => {
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
  let maxVenta = dataVenta.reduce((max, p) => (p.price/p.area) > max ? (p.price/p.area) : max, (venta[0].price/(venta[0].area)));
  let minVenta = dataVenta.reduce((min, p) => (p.price/p.area) < min ? (p.price/p.area) : min, (venta[0].price/(venta[0].area)));
  console.log("maxVenta", maxVenta, "minVenta", minVenta);


  let maxLng = dataVenta.reduce((max, p) => p.lng > max ? p.lng : max, venta[0].lng);
  let minLng = dataVenta.reduce((min, p) => p.lng < min ? p.lng : min, venta[0].lng);
  let centerLng = (maxLng + minLng) / 2;
  console.log("maxLng", maxLng, "minLng", minLng);


  let maxLat = dataVenta.reduce((max, p) => p.lat > max ? p.lat : max, venta[0].lat);
  let minLat = dataVenta.reduce((min, p) => p.lat < min ? p.lat : min, venta[0].lat);
  let centerLat = (maxLat + minLat) / 2;
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
    return {
      ...item,
      mean: (item.c/1000000).toFixedDown(1),
      c: normalized.toFixedDown(2),
    }
  });


  return {
    props: {
      venta:{
        maxVenta,
        minVenta,
        maxLng,
        minLng,
        maxLat,
        minLat
      },
      center: spects.center,
      zoom: spects.zoom,
      matriz_final,
      steps: STEPS,
      name: spects.name,
      propertiesCount: venta.length,
      ogImage: spects?.ogImage ? `${SPECTS_LOCATION_LINK}/${CITY}/${spects?.ogImage}` : null,
    }
  }
}

export async function getStaticPaths() {
  let paths = [
    {
      params: {
        slug: [],
      },
    },
    {
      params: {
        slug: ["villavicencio"],
      },
    },
    {
      params: {
        slug: ["sogamoso-boyaca"],
      },
    },
    {
      params: {
        slug: ["bucaramanga-santander"],
      },
    },
  ];
  // console.log("getStaticPaths", paths);
  return {paths, fallback: false};
}

const Home = ({venta, center, matriz_final, steps, zoom, name, propertiesCount, ogImage}) => {

  const markerRef = useRef(null);
  const [popupInfo, setPopupInfo] = useState({
    visible: false,
    center: [...center],
    price: 0,
  });
  const [markerCenter, setMarkerCenter] = useState({
    visible: false,
    center: [...center]
  });
  const [intructivePopup, setIntructivePopup] = useState(false);

  const [mapEvents, setMapEvents] = useState(()=>{});
  const [rectangleEvents, setRectangleEvents] = useState(() =>(lat, lng, steps)=>({}));

  const loadMouseBehavior = async () => {
    setIntructivePopup(true);
    const MapMouse = (await import('@components/MapContent/MapMouse')).default;
    const {rectangleEvents: rEvents} = MapMouse({popupInfo, setPopupInfo, setIntructivePopup});
    console.log("rEvents", rEvents(2,3,{lat: 1, lng: 1}));
    setRectangleEvents(() => (rEvents));
  };
  const isTouchDevice = () =>{
    return (('ontouchstart' in window) ||
       (navigator.maxTouchPoints > 0) ||
       (navigator.msMaxTouchPoints > 0));
  }

  const loadTouchBehavior = async () => {
    setIntructivePopup(false);
    const MapTouch = (await import('@components/MapContent/MapTouch')).default;
    const {mapEvents: mEvents} = MapTouch({popupInfo, setPopupInfo, markerCenter, setMarkerCenter, markerRef, matriz_final, steps});
    setMapEvents(() => (mEvents));
  }

  const init = () => {
    if (isTouchDevice()) {
      loadTouchBehavior();
      return;
    }
    loadMouseBehavior();
  }


  useEffect(() => {
    init();
  }, []);

  return (
    <Layout name={name}>
      <Head>
        <title>{name} - Visualiza los Costos por Metro Cuadrado en Tiempo Real</title>
        <meta name="description" content={`Descubre el panorama inmobiliario de ${name} con nuestro mapa interactivo. Visualiza de manera sencilla y clara los precios del metro cuadrado en cada zona.`} />
        <meta name="og:title" property="og:title" content={`${name} - Vea su mapa inmoviliario`}></meta>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="twitter:card" content={`${name} - Vea su mapa inmoviliario`}></meta>
        <meta name='robots' content='index, follow' />
        <meta name="twitter:site" content="@carlosjm5" />
        <meta name="twitter:creator" content="@carlosjm5" />
        <meta property="og:url" content="https://maijaus.co" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${name} - Vea su mapa inmoviliario`} />
        <meta property="og:description" content={`Descubre el panorama inmobiliario de ${name} con nuestro mapa interactivo. Visualiza de manera sencilla y clara los precios del metro cuadrado en cada zona.`} />
        <meta property="og:image" content={ogImage || "https://maijaus.co/og-image.png"} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        <link rel="preconnect" href="https://c.tile.openstreetmap.org"/>
        <link rel="dns-prefetch" href="https://c.tile.openstreetmap.org" />
        <link rel="preconnect" href="https://b.tile.openstreetmap.org" />
        <link rel="dns-prefetch" href="https://b.tile.openstreetmap.org" />
        <link rel="preconnect" href="https://a.tile.openstreetmap.org" />
        <link rel="dns-prefetch" href="https://a.tile.openstreetmap.org" />

        {/* 
        <link rel="preload" as="image" href="https://c.tile.openstreetmap.org/14/4843/8002.png" />
        <link rel="preload" as="image" href="https://b.tile.openstreetmap.org/14/4839/8002.png" />
        <link rel="preload" as="image" href="https://a.tile.openstreetmap.org/14/4841/8002.png" />
        <link rel="preload" as="image" href="https://c.tile.openstreetmap.org/14/4840/8002.png" />
        <link rel="preload" as="image" href="https://b.tile.openstreetmap.org/14/4845/8002.png" />
        <link rel="preload" as="image" href="https://b.tile.openstreetmap.org/14/4842/8002.png" />
        <link rel="preload" as="image" href="https://a.tile.openstreetmap.org/14/4838/8002.png" />
        <link rel="preload" as="image" href="https://a.tile.openstreetmap.org/14/4844/8002.png" />
        <link rel="preload" as="image" href="https://c.tile.openstreetmap.org/14/4837/8002.png" />
        <link rel="preload" as="image" href="https://b.tile.openstreetmap.org/14/4841/8003.png" />
        <link rel="preload" as="image" href="https://c.tile.openstreetmap.org/14/4839/8003.png" />
        <link rel="preload" as="image" href="https://a.tile.openstreetmap.org/14/4840/8003.png" />
        <link rel="preload" as="image" href="https://c.tile.openstreetmap.org/14/4842/8003.png" />
        <link rel="preload" as="image" href="https://a.tile.openstreetmap.org/14/4843/8003.png" />
        <link rel="preload" as="image" href="https://b.tile.openstreetmap.org/14/4838/8003.png" />
        <link rel="preload" as="image" href="https://b.tile.openstreetmap.org/14/4844/8003.png" />
        <link rel="preload" as="image" href="https://c.tile.openstreetmap.org/14/4845/8003.png" />
        <link rel="preload" as="image" href="https://c.tile.openstreetmap.org/14/4841/8004.png" />
        <link rel="preload" as="image" href="https://b.tile.openstreetmap.org/14/4840/8004.png" />
        <link rel="preload" as="image" href="https://a.tile.openstreetmap.org/14/4842/8004.png" />
        <link rel="preload" as="image" href="https://a.tile.openstreetmap.org/14/4839/8004.png" />
        <link rel="preload" as="image" href="https://b.tile.openstreetmap.org/14/4843/8004.png" />
        <link rel="preload" as="image" href="https://c.tile.openstreetmap.org/14/4838/8004.png" />
        <link rel="preload" as="image" href="https://b.tile.openstreetmap.org/14/4837/8004.png" />
        <link rel="preload" as="image" href="https://c.tile.openstreetmap.org/14/4844/8004.png" />
        <link rel="preload" as="image" href="https://a.tile.openstreetmap.org/14/4845/8004.png" />
        <link rel="preload" as="image" href="https://a.tile.openstreetmap.org/14/4841/8005.png" />
        <link rel="preload" as="image" href="https://c.tile.openstreetmap.org/14/4840/8005.png" />
        <link rel="preload" as="image" href="https://b.tile.openstreetmap.org/14/4842/8005.png" />
        <link rel="preload" as="image" href="https://c.tile.openstreetmap.org/14/4837/8005.png" />
        <link rel="preload" as="image" href="https://b.tile.openstreetmap.org/14/4845/8005.png" />
        <link rel="preload" as="image" href="https://b.tile.openstreetmap.org/14/4839/8005.png" />
        <link rel="preload" as="image" href="https://c.tile.openstreetmap.org/14/4843/8005.png" />
        <link rel="preload" as="image" href="https://a.tile.openstreetmap.org/14/4844/8005.png" />
        <link rel="preload" as="image" href="https://a.tile.openstreetmap.org/14/4838/8005.png" />
        <link rel="preload" as="image" href="https://c.tile.openstreetmap.org/13/2419/4000.png" />
        <link rel="preload" as="image" href="https://b.tile.openstreetmap.org/13/2421/4000.png" />
        <link rel="preload" as="image" href="https://a.tile.openstreetmap.org/13/2420/4000.png" />
        <link rel="preload" as="image" href="https://b.tile.openstreetmap.org/13/2420/4001.png" />
        <link rel="preload" as="image" href="https://a.tile.openstreetmap.org/13/2419/4001.png" />
        <link rel="preload" as="image" href="https://c.tile.openstreetmap.org/13/2421/4001.png" />
        <link rel="preload" as="image" href="https://c.tile.openstreetmap.org/13/2420/4002.png" />
        <link rel="preload" as="image" href="https://b.tile.openstreetmap.org/13/2419/4002.png" />
        <link rel="preload" as="image" href="https://a.tile.openstreetmap.org/13/2421/4002.png" />
        <link rel="preload" as="image" href="https://a.tile.openstreetmap.org/13/2420/4003.png" />
        <link rel="preload" as="image" href="https://c.tile.openstreetmap.org/13/2419/4003.png" />
        <link rel="preload" as="image" href="https://b.tile.openstreetmap.org/13/2421/4003.png" />
        */}
        <link rel="preload" as="image" href="https://maijaus.co/marker-icon-2x.png" />
        <link rel="preload" as="image" href="https://maijaus.co/marker-shadow.png" />
        
      </Head>
      <Map center={center} zoom={zoom}
        Events={mapEvents}>
        {({TileLayer, Rectangle, Marker, Popup}) => (
          <>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {
              matriz_final.map((item, index) => {
                const {l: [lat, lng], c, mean} = item;
                const events = rectangleEvents(lat, lng, steps, mean);
                return (
                  <Rectangle
                    key={index}
                    bounds={[[lat, lng], [lat + steps.lat, lng + steps.lng]]}
                    pathOptions={{ color: 'red', fillOpacity: c, "weight": 0.5}}
                    eventHandlers={events}
                  />
                )
              })
            }
            {popupInfo.visible && popupInfo.center && (
                <Popup position={popupInfo.center}>
                    <strong>Costo por metro cuadrado:</strong>
                    <p><strong>{popupInfo.price}</strong> millones COP</p>
                </Popup>)
            }
            {markerCenter.visible && markerCenter.center && (
                <Marker position={markerCenter.center} ref={markerRef}>
                    <Popup>
                        <p>Arrastra el mapa hacia una<br/>zona roja de interés</p>
                    </Popup>
                </Marker>)
            }

            {intructivePopup && (
                <Popup position={popupInfo.center}>
                    <p>Mueva el mouse sobre los cuadros rojos para saber su costo por metro cuadrado</p>
                </Popup>)
            }
          </>
        )}
      </Map>
      <div className={styles.infoCard}>
        <h1>Visualiza los Costos por Metro Cuadrado</h1>
        <p>Fueron analizadas cerca de {propertiesCount} propiedades en {name}.</p>
        <p>¿Quieres ver otras ciudades? Dejanos un comentario <a href='https://www.facebook.com/permalink.php?story_fbid=pfbid02Udir23WrjrPquw1FG4WTKeJruat7svMNAvzCx9sLFDNRSJ5WWNu39Z6NRPWXS3YPl&id=61553905606457' target="_blank"><strong>aquí</strong></a>.</p>
      </div>
    </Layout>
  )
}

export default Home;