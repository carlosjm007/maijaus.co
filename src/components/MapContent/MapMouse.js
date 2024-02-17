// import React, {useState} from 'react';
// // import styles from './MapContent.module.scss';
// import Map from '@components/Map';

const MapMouse = ({ popupInfo, setPopupInfo, setIntructivePopup }) => {

    const setPopupInfoVisible = (visible) => {
        setPopupInfo({
            ...popupInfo,
            visible,
        });
    };

    const rectangleEvents = (lat, lng, steps, mean, arriendo)=>{
        return ({
            mouseover: (e) => {
                setIntructivePopup(false);
                setPopupInfo({
                    visible: true,
                    center: [lat + steps.lat/2, lng + steps.lng/2],
                    price: mean,
                    arriendo,
                });
            },
            mouseout: (e) => {
                setPopupInfoVisible(false);
            }
        })
    }
    return ({
        rectangleEvents
    });
    
    // return (
    //     // <div className={styles.mapMouse}>
    //         <Map width="800" height="400" center={center} zoom={14}>
    //             {({TileLayer, Rectangle, Popup}) => (
    //             <>
    //                 <TileLayer
    //                 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    //                 attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
    //                 />
    //                 {
    //                     matriz_final.map((item, index) => {
    //                         const {l: [lat, lng], c, mean} = item;
    //                         return (
    //                         <Rectangle
    //                             key={index}
    //                             bounds={[[lat, lng], [lat + steps.lat, lng + steps.lng]]}
    //                             pathOptions={{ color: 'red', fillOpacity: c, "weight": 0.5}}
    //                             eventHandlers={{
    //                                 mouseover: (e) => {
    //                                     console.log("mouseover", e);
    //                                     setPopupInfo({
    //                                         visible: true,
    //                                         center: [lat + steps.lat/2, lng + steps.lng/2],
    //                                         price: mean,
    //                                     });
    //                                 },
    //                                 mouseout: (e) => {
    //                                     console.log("mouseOut", e);
    //                                     setPopupInfoVisible(false);
    //                                 }
    //                             }}
    //                             >
    //                         </Rectangle>
    //                         )
    //                     })
    //                 }
    //                 {popupInfo.visible && popupInfo.center&& popupInfo.price && (
    //                     <Popup position={popupInfo.center}>
    //                         <strong>Valor metro cuadrado:</strong>
    //                         <p>{popupInfo.price} millones COP</p>
    //                     </Popup>)
    //                 }
    //             </>
    //             )}
    //         </Map>
    //     // </div>
    // )
    
};

export default MapMouse;