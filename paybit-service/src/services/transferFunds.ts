const transferFunds = async (
    senderId: string,
    receiverId: string,
    amount: number)
    : Promise<false | { success: boolean; message: string }> => {
    return false; // implement transfer logic here
}
export default transferFunds;