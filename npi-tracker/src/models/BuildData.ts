export interface OrderDetails {
    user: string;
    buildId: string;
    rackSku: string;
    rackGenName: string;
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
        crdNumber: "",
        crdRevision: "",
        buildStage: "",
        rackQty: 1
    },
    racks: [],
    team: []
};