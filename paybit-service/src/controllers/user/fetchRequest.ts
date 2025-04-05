import { Request as ExpressRequest, Response } from 'express';
import Request from '../../db/requests';

const fetchRequest = async (req: ExpressRequest, res: Response): Promise<Response> => {
    try {
        const type = req.query.type;
        if (!type || (type !== 'sent' && type !== 'received')) {
            return res.status(400).json({
                message: "Invalid query param 'type'. Allowed values: sent, received."
            });
        }

        // Assumes that req.user is populated with the authenticated user's info.
        const userId = req.user.id;
        let requests;

        if (type === 'sent') {
            requests = await Request.find({ sender: userId });
        } else {
            requests = await Request.find({ receiver: userId });
        }
        return res.status(200).json({ data: requests });
    } catch (error) {
        console.error('Error fetching requests:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export default fetchRequest;