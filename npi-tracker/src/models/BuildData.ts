export interface OrderDetails {
    user: string;
    buildId: string;
    rackSku: string;
    rackGenName: string;
    buildingBlock:string;
    crdNumber: string;
    crdRevision: string;
    buildStage: string;
    rackQty: Number;
}

export interface RackInfo {
    rackSerial: string;
}

export interface AssignedUsers{
    user_email: string;
}

export interface BuildData {
    orderDetails: OrderDetails;
    racks: RackInfo[];
    team: AssignedUsers[];
}

export const DEFAULT_BUILD_DATA:
BuildData = {
    orderDetails: {
        user: "webuser@microsoft.com",
        buildId: "",
        rackSku: "",
        rackGenName: "",
        buildingBlock: "",
        crdNumber: "",
        crdRevision: "",
        buildStage: "",
        rackQty: 1
    },
    racks: [],
    team: []
};