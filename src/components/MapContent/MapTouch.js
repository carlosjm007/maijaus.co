// import dynamic from 'next/dynamic';
// import { useMapEvents } from 'react-leaflet/hooks';

// const { useMapEvents } = dynamic(() => import('react-leaflet/hooks'), {
//     ssr: false
// });

let useMapEvents = null;

const MapTouch = ({popupInfo, setPopupInfo, markerCenter, setMarkerCenter, markerRef, matriz_final, steps}) => {
    
    const setPopupInfoVisible = (visible) => {
        setPopupInfo({
            ...popupInfo,
            visible,
        });
    }

    const setMarkerCenterVisible = (visible) => {
        setMarkerCenter({
            ...markerCenter,
            visible,
        });
    }

    const selectZone = (center) => {
        const zone = matriz_final.find((item) => {
            const {l: [lat, lng]} = item;
            if (!(lat < center.lat && (lat + steps.lat) > center.lat)) {
                return false;
            }
            if (!(lng < center.lng && (lng + steps.lng) > center.lng)) {
                return false;
            }
            return true;
        });
        if (!zone) {
            setMarkerCenter({
                visible: true,
                center: [center.lat, center.lng]
            });
            setPopupInfoVisible(false);
            markerRef?.current?.openPopup();
            return;
        }
        setPopupInfo({
            visible: true,
            center: [zone.l[0] + steps.lat, zone.l[1] + steps.lng/2],
            price: zone.mean,
        });
        setMarkerCenterVisible(false);
    }

    const mapEvents = ()=>{
        if (!useMapEvents?.useMapEvents) {
            return null;
        }
        const map = useMapEvents.useMapEvents({
            // click: (e) => {
            //     console.log("mapClick", e);
            // },
            moveend: () => {
                const center = map.getCenter();
                selectZone(center);
            },
            movestart: () => {
                setPopupInfoVisible(false);
            },
            move: () => {
                const center = map.getCenter();
                setMarkerCenter({
                    visible: true,
                    center: [center.lat, center.lng],
                });
                markerRef?.current?.closePopup();
            },
            load: () => {
                const center = map.getCenter();
                selectZone(center);
            }
        });
        return null;
    }

    const init = async () => {
        useMapEvents = await import('react-leaflet/hooks');
        selectZone({lat: markerCenter.center[0], lng: markerCenter.center[1]});
        if (!markerRef) {
            return
        }
        window.setTimeout(() => {
          markerRef?.current?.openPopup();
        }, 50);
    }

    init();

    return ({
        mapEvents
    });
    // return (
    //     // <div className={styles.MapTouch}>
    //         <Map
    //             width="800" height="1000" center={center} zoom={14}
    //             Events={mapEvents}>
    //             {({TileLayer, Rectangle, Popup, Marker}) => (
    //             <>
    //                 <TileLayer
    //                 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    //                 attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
    //                 />
    //                 {
    //                     matriz_final.map((item, index) => {
    //                         const {l: [lat, lng], c} = item;
    //                         return (
    //                             <Rectangle
    //                                 key={index}
    //                                 bounds={[[lat, lng], [lat + steps.lat, lng + steps.lng]]}
    //                                 pathOptions={{ color: 'red', fillOpacity: c, "weight": 0.5}}
    //                             />
    //                         )
    //                     })
    //                 }
    //                 {popupInfo.visible && popupInfo.center && (
    //                     <Popup position={popupInfo.center}>
    //                         <strong>Valor metro cuadrado:</strong>
    //                         <p>{popupInfo.price} millones COP</p>
    //                     </Popup>)
    //                 }
    //                 {markerCenter.visible && markerCenter.center && (
    //                     <Marker position={markerCenter.center} ref={markerRef}>
    //                         <Popup>
    //                             <p>Arrastra el mapa hacia una<br/>zona roja de interés</p>
    //                             <p>Así conocerás su precio<br/>promedio del metro cuadrado</p>
    //                         </Popup>
    //                     </Marker>)
    //                 }
    //             </>
    //             )}
    //         </Map>
    //     // </div>
    // )
    
};

export default MapTouch;