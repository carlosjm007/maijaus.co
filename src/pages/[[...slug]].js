import Head from 'next/head'
import styles from '@/styles/Home.module.css';
import Map from '@components/Map';
import Layout from '@components/Layout';
import React, { useState, useEffect, useRef } from 'react';

const SPECTS_LOCATION_LINK = "https://maijaus.z20.web.core.windows.net";

const getFile = async (url) => {
  const res = await fetch(url);
  const data = await res.json();
  return data;
};

export async function getStaticProps({params}) {
  const CITY = params.slug?.[0] || "villavicencio";
  const venta = await getFile(`${SPECTS_LOCATION_LINK}/${CITY}/venta.json`);
  const spects = await getFile(`${SPECTS_LOCATION_LINK}/${CITY}/spects.json`);
  let arriendo = null;

  if(spects?.hasRent){
    arriendo = await getFile(`${SPECTS_LOCATION_LINK}/${CITY}/arriendo.json`);
  }

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

  // import dinamically dataToGridMap
  const { dataToGridMap, mergeArriendoIntoVentas } = await import('@/process/dataToGridMap');
  
  const {
    matriz_final: matriz_final_venta, 
    maxCost: maxVenta,
    minCost: minVenta
  } = dataToGridMap(venta, spects, AREA_SELECTED, STEPS);

  const getDataArriendo = () => {
    if(arriendo){
      return dataToGridMap(arriendo, spects, AREA_SELECTED, STEPS);
    }
    return {
      matriz_final: null, 
      maxCost: null,
      minCost: null
    }
  }

  const getMergedData = () => {
    if(arriendo){
      return mergeArriendoIntoVentas(matriz_final_venta, matriz_final_arriendo);
    }
    return matriz_final_venta;
  }

  const {
    matriz_final: matriz_final_arriendo
  } = getDataArriendo();


  const matriz_final = getMergedData(matriz_final_venta, matriz_final_arriendo);

  console.log("matriz_final", matriz_final);

  return {
    props: {
      venta:{
        maxVenta,
        minVenta
      },
      center: spects.center,
      zoom: spects.zoom,
      matriz_final: matriz_final,
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

const Home = ({center, matriz_final, steps, zoom, name, propertiesCount, ogImage}) => {

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
                const {l: [lat, lng], c, mean, arriendo} = item;
                const events = rectangleEvents(lat, lng, steps, mean, arriendo);
                return (
                  <Rectangle
                    key={index}
                    bounds={[[lat, lng], [lat + steps.lat, lng + steps.lng]]}
                    pathOptions={{
                      color: arriendo ? 'purple' : "red",
                      fillOpacity: c,
                      weight: arriendo ? 2.5 : 0,
                      fillColor: 'red',
                      zIndex: arriendo ? 1 : 0,
                    }}
                    eventHandlers={events}
                  />
                )
              })
            }
            {popupInfo.visible && popupInfo.center && (
                <Popup position={popupInfo.center}>
                    <h3>Reporte del metro cuadrado</h3>

                    {popupInfo.price && (
                      <p>Costo: <strong>{popupInfo.price}</strong>M &#36; / &#13217;</p>
                    )}
                    {popupInfo.arriendo && (
                      <p>Arriendo: <strong>{popupInfo.arriendo}</strong> mil 	&#36; / &#13217; mensual</p>
                    )}
                    <span style={{fontSize: "smaller", fontWeight: "bold"}}>Estos son datos promedio</span>
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