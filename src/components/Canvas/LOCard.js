import { useCallback, useEffect, useState } from 'react';
import { useHover, useFloating, useInteractions, useTransitionStyles } from '@floating-ui/react';
import { Handle, Position, useStore, MarkerType, setEdges, useReactFlow } from 'reactflow';
import IconProvider from '@/helpers/IconProvider';
import moment from 'moment';
import PropList from './ORContent/PropList';
import useInternalStore from '@/store';
import { expansion } from '@/helpers/Enums';



const AddIcon = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20"><path d="M450-200v-250H200v-60h250v-250h60v250h250v60H510v250h-60Z" /></svg>
    )
}




const getTypeString = (loType) => {
    // console.log("Type of Type String:", typeof loType, loType)
    if (Array.isArray(loType)) {
        return loType.at(-1).split("#").at(-1)
    } else {
        return loType.split("#").at(-1)
    }
}


const LOCard = ({ id, data, isConnectable }) => {

    const [expansionState, setExpansionState] = useState(expansion.Closed)
    const [cardData, setCardData] = useState(null)
    const [links, setLinks] = useState([])
    const [inEdit, setInEdit] = useState(0)
    const [deleteAll, setDeleteAll] = useState(false)

    const { servers } = useInternalStore()
    const position = useStore(s => s.nodeInternals.get(id)?.position);

    const [color, setColor] = useState("#ffffff")
    const [displayName, setDisplayName] = useState("")
    const [token, setToken] = useState("")
    const [is404, setIs404] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [refetch, setRefetch] = useState(false)
    const [firstOpen, setFirstOpen] = useState(false)

    const RFI = useReactFlow();


    useEffect(() => {
        const host = data.uri.split("//").at(-1).split("/logistics-objects").at(0)
        servers.map((server, index) => {
            if (!host.indexOf(server.host)) {
                setColor(server.color)
                setToken(server.token)
                setDisplayName(server.org_name)
            }
        })

        token && getCardData(data.uri, token)
        cardData && console.log("CARD DATA:", cardData)
    }, [token, servers])

    const getCardData = async (url = "", token) => {
        let send_header = {
            "cache-control": "no-cache",
            "Authorization": "Bearer " + token
        }

        let prom = fetch(url,
            {
                cache: "no-store",
                headers: send_header
            }
        )
        prom.catch(() => { setIs404(true) })
        let res = await prom;
        let body = await res.json()
        console.log("JSON: ", body)
        let header_obj = {};
        res.headers.forEach((val, key) => { header_obj[key] = val })
        let data = { headers: header_obj, body: body }
        setCardData(data)
    }

    useEffect(() => {
        console.log("TRIGGERED refetch")
        if (refetch || firstOpen) {
            console.log("REFETCH")
            const host = data.uri.split("//").at(-1)
            servers.map((server, index) => {
                if (!host.indexOf(server.host)) {
                    setColor(server.color)
                    setToken(server.token)
                    setDisplayName(server.org_name)
                }
            })
            getCardData(data.uri, token)
            console.log("REFETCH DONE:", cardData)
            setRefetch(false)
        }
    }, [refetch, servers, token, setRefetch, firstOpen, token])


    useEffect(() => {
    }, [cardData])

    const addLinks = () => {
        let old_link = {};
        const offset = (-1 * ((links.length / 2) - 0.5)) * 350
        links.map((link, index) => {
            console.log(link)
            RFI.addNodes({
                id: link.loLocation,
                type: 'LO',
                dragHandle: '#node-header',
                data: {
                    uri: link.loLocation,
                },
                position: { x: position.x + 800, y: (position.y + offset + ((index + 0) * 350)) },
            })
            RFI.addEdges({
                label: link.loType,
                id: (id + "->" + link.loLocation),
                target: link.loLocation,
                source: id,
                type: 'floating',
                markerEnd: {
                    type: MarkerType.Arrow,
                },
            });
            old_link = link

        })
    }

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
    });


    const hover = useHover(context, {
        delay: {
            // open: 0,
            open: 1000,
            close: 0
        }
    });

    const { getReferenceProps, getFloatingProps } = useInteractions([
        hover,
    ]);

    useEffect(() => {
        console.log("CARDDATA UPDATED", cardData)
    }, [cardData])



    return (
        <div className=" rounded-lg bg-white/[0.9] drop-shadow-lg shadow-neutral-750 nowheel">

            {/* <Handle type="none" position={Position.Top} isConnectable={isConnectable}></Handle> */}
            <div id="node-header" className={`flex rounded-t-lg w-[350px] h-[110px] border-b-[1px] border-gray-200  ${is404 ? "bg-red-100" : "bg-slate-50/[0.9]"}  duration-500 rounded-lg ${expansionState > expansion.Closed ? "" : ""}`}>
                <div id="header-left-col" className='block relative w-full'>
                    <div note="colored bar"
                        className={`absolute left-0  w-3 transition-all delay-150 duration-200  h-full rounded-l-lg ${expansionState > expansion.Closed ? "" : ""}`}
                        style={{ background: color }}
                    >
                    </div>
                    <div className="ml-4 mt-2">

                        <div id="header-top-row" className='inline-flex ml-1'>
                            <IconProvider objectType={cardData && cardData.body['@type']} className="" />
                            <span className=' ml-2 font-sans text-2xl mb-1 ml-1 mr-1'>
                                LO:
                            </span>
                            <span className='font-semibold text-2xl table-cell align-middle mr-auto'>
                                <div className="w-[160px] overflow-hidden">
                                    {cardData && getTypeString(cardData.body['@type'])}
                                </div>
                                {(!cardData && !is404) &&
                                    <div role="status" className='absolute top-[30px] left-[150px] scale-150'>
                                        <svg aria-hidden="true" class="w-8 h-8 mr-2 text-gray-200 animate-spin dark:text-gray-600 " style={{ fill: color }} viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                        </svg>
                                        <span class="sr-only">Loading...</span>
                                    </div>
                                }
                                {is404 &&
                                    <div className='absolute top-[40px] left-[110px] scale-150 text-red-400 text-lg'>
                                        Invalid Request
                                    </div>

                                }
                            </span>
                            {/* <SyncStatus isSynced={true} /> */}
                            {cardData && cardData.headers["latest-revision"] &&
                                <div className="bg-slate-200/[0.9] p-1 mr-12 mt-2 rounded-lg text-sm align-baseline w-[50px] ">
                                    rev. {cardData.headers["latest-revision"]}
                                </div>
                            }

                        </div>

                        <div className="w-full inline-block ml-2">
                            <span className='block text-xs font-bold ml-1'>
                                {displayName && displayName}
                                {!displayName && cardData && cardData.body['@id'].split("/").slice(2, -2).join("/")}
                            </span>
                            {(!is404 && isOpen) &&
                                <div
                                    ref={refs.setFloating}
                                    style={{ ...floatingStyles, fontSize: "0.67rem", lineHeight: "0.9rem" }}
                                    {...getFloatingProps()}
                                    className=' bg-slate-200/[0.9] drop-shadow-lg p-2 rounded-lg z-10 w-[200px] backdrop-blur'
                                >
                                    {"Click to Copy"}
                                </div>
                            }
                            {!is404 &&
                                <button className='text-xs block  whitespace-nowrap w-[250px] overflow-clip text-ellipsis bg-slate-100/[0.9] active:bg-slate-300 p-1 rounded-sm  duration-200 transition-color'
                                    ref={refs.setReference} {...getReferenceProps()}
                                    onClick={() => { navigator.clipboard.writeText(cardData ? cardData.body['@id'] : "") }}>
                                    <span className='flex justify-start'>
                                        {cardData && cardData.body['@id'].split("/").slice(-2).join("/")}
                                    </span>
                                </button>
                            }

                        </div>
                        {cardData && cardData.headers["last-modified"] &&
                            <span className='absolute bottom-1 font-light text-xs flex'>
                                <svg className="inline-block my-auto ml-2" xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20"><path d="m614-310 51-51-149-149v-210h-72v240l170 170ZM480-96q-79.376 0-149.188-30Q261-156 208.5-208.5T126-330.958q-30-69.959-30-149.5Q96-560 126-630t82.5-122q52.5-52 122.458-82 69.959-30 149.5-30 79.542 0 149.548 30.24 70.007 30.24 121.792 82.08 51.786 51.84 81.994 121.92T864-480q0 79.376-30 149.188Q804-261 752-208.5T629.869-126Q559.738-96 480-96Zm0-384Zm.477 312q129.477 0 220.5-91.5T792-480.477q0-129.477-91.023-220.5T480.477-792Q351-792 259.5-700.977t-91.5 220.5Q168-351 259.5-259.5T480.477-168Z" /></svg>
                                <span className='inline-block align-baseline my-auto ml-1'>
                                    {moment(Date.parse(cardData.headers["last-modified"])).fromNow()}
                                </span>
                            </span>
                        }
                    </div>
                </div>
                <button
                    className='relative'
                    onClick={() => { setExpansionState((expansionState + 1) % 3); setFirstOpen(true) }}
                >
                    <svg className={`absolute bottom-0 right-0 transition-all duration-500 ${expansionState == expansion.Folded ? "rotate-90" : ""} ${expansionState == expansion.Expanded ? "rotate-180" : ""}`} xmlns="http://www.w3.org/2000/svg" height="36" viewBox="0 -960 960 960" width="36"><path d="M480-333 240-573l51-51 189 189 189-189 51 51-240 240Z" /></svg>
                </button>

                {/* LEFT SIDE BUTTONS */}
                <div note="left-shifted-buttons" className="relativ ">
                    {/* OPEN LINKS BUTTON */}
                    {links.length ?
                        <button className="absolute right-[-15px] mt-3
                        hover:bg-neutral-100 active:bg-neutral-200 transition-all duratio-300
                        bg-white/[0.9] rounded-full p-1 drop-shadow-md"
                            onClick={() => { addLinks() }}>
                            <span className="mx-1 text-sm">{links.length}</span>
                            <svg className="inline" xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20"><path d="M450-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h170v60H280q-58.333 0-99.167 40.765-40.833 40.764-40.833 99Q140-422 180.833-381q40.834 41 99.167 41h170v60ZM325-450v-60h310v60H325Zm185 170v-60h170q58.333 0 99.167-40.765 40.833-40.764 40.833-99Q820-538 779.167-579 738.333-620 680-620H510v-60h170q83 0 141.5 58.5T880-480q0 83-58.5 141.5T680-280H510Z" /></svg>
                        </button>
                        : ""}

                    <button className="absolute right-[-15px] mt-[52px]
                hover:bg-neutral-100 active:bg-neutral-200 transition-all duratio-300
                bg-white/[0.9] rounded-full p-1 drop-shadow-md">
                        <AddIcon />
                    </button>

                </div>
            </div >

            <div note="midsection"
                className={`
            ${(expansionState == expansion.Closed) ? "max-h-[0px] max-0" : ""} 
            ${(expansionState == expansion.Folded) ? "max-h-[250px]" : ""} 
            ${(expansionState == expansion.Expanded) ? "max-h-[500px]" : ""} 
            transition-all duration-300 nodrag w-full w-[235px] rounded-b-lg overflow-hidden
            `}
                style={{ userSelect: "text", cursor: "text" }}
            >
                {/* and set the styles user-select: 'text' and cursor: 'text' */}
                <div className={`w-full ${expansionState == expansion.Closed && "hidden"} `}>
                    {/* Property List */}
                    {cardData && cardData.body &&
                        < PropList
                            id={id}
                            cardData={cardData}
                            expansionState={expansionState}
                            links={links}
                            setLinks={setLinks}
                            inEdit={inEdit}
                            setInEdit={setInEdit}
                            setRefetch={setRefetch}
                            token={token}
                        />}
                </div>
                {/* Buttons */}
                <div className={`h-10 m-2 mb-2
                            ${expansionState == expansion.Closed && "hidden"} 
                            `}>

                    <div className="relative ">
                        <button
                            onClick={() => { if (inEdit == 0) { setInEdit(1) } else if (inEdit == 1) { setInEdit(2) } }}
                            className={` absolute top-0 border-slate-400 rounded-lg ${inEdit ? "bg-blue-400" : "border-[1px]"}`}>
                            {!inEdit && <svg className='fill-slate-800 m-2 left-[-1px] top-[-1px]' xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16"><path d="M180-180h44l443-443-44-44-443 443v44Zm614-486L666-794l42-42q17-17 42-17t42 17l44 44q17 17 17 42t-17 42l-42 42Zm-42 42L248-120H120v-128l504-504 128 128Zm-107-21-22-22 44 44-22-22Z" /></svg>}

                            {inEdit != 0 && <svg className='fill-slate-50 m-1' xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="m382.808-258.693-207.73-207.73 40.037-40.038 167.693 167.885 362.269-362.269 39.845 40.037-402.114 402.115Z" /></svg>}
                        </button>
                        {inEdit != 0 && <button
                            onClick={() => { setInEdit(0) }}
                            className={` absolute  border-slate-400 rounded-lg left-10 top-[-1px] border-[1px]`}>
                            <svg className="fill-slate-800 m-1 rotate-45" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M452.116-216.462v-235.962H216.154v-55.96h235.962v-235.962h55.96v235.962h235.962v55.96H508.076v235.962h-55.96Z" /></svg>
                        </button>}
                        {inEdit != 0 && <button
                            onClick={() => { setInEdit(!inEdit) }}
                            className={` absolute  border-slate-400 rounded-lg left-20 top-[-1px] border-[1px]`}>
                            <svg className="fill-slate-800 m-1" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M452.116-216.462v-235.962H216.154v-55.96h235.962v-235.962h55.96v235.962h235.962v55.96H508.076v235.962h-55.96Z" /></svg>
                        </button>}
                        {inEdit != 0 &&
                            <button onClick={() => { setDeleteAll(true) }}
                                className='absolute p-2 bg-red-500 rounded-lg text-white text-xs right-2 top-0 px-2'>
                                <svg className="fill-white inline mr-1" xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16"><path d="M261-120q-24.75 0-42.375-17.625T201-180v-570h-41v-60h188v-30h264v30h188v60h-41v570q0 24-18 42t-42 18H261Zm438-630H261v570h438v-570ZM367-266h60v-399h-60v399Zm166 0h60v-399h-60v399ZM261-750v570-570Z" /></svg>
                                <span className='inline'>
                                    Delete
                                </span>
                            </button>
                        }
                    </div>
                </div>

            </div>


            <Handle
                className='hidden'
                type="source"
                position={Position.Bottom}
                id="a"
                // style={handleStyle}
                isConnectable={isConnectable}
            />
            <Handle
                className='hidden'
                type="target"
                position={Position.Bottom}
                id="a"
                // style={handleStyle}
                isConnectable={isConnectable}
            />
        </div >
    );
}

export default LOCard;
