const ObjectID    = require("mongodb").ObjectID;
const {connect}   = require('mm')

module.exports = async (dbName='marketplace') => {
    const {Savable, slice} = await connect(dbName)

    async function getModels({id}){
        const SlicedSavable = slice([id, 'user'])

        class User extends SlicedSavable {
            constructor(...params){
                super(...params)
                //TODO: calc likes count by getter (no two-way relation for this to avoid overflow on many Kilos of likes
                //cached like count, which incremented and decremented
                //
                //following and followers array

            }


            static get relations(){ //don't needed due to ___owner in most cases
                return {
                    avatar : "userAvatar",
                    incomings: "to",
                }
            }

            static get guestRelations(){
                return ["incomings"]
            }

		async getACL(){
		    return [this._id.toString(), "user"]
		}
        }
        SlicedSavable.addClass(User)

        class OwnerSlicedSavable extends SlicedSavable {
            get owner(){
                if (!this.___owner) return this.___owner

                return SlicedSavable.m.User.findOne({_id: ObjectID(this.___owner)})
            }
        }


        class Image extends OwnerSlicedSavable {
            constructor(...params){
                super(...params)
            }


            static async fromFileData(fileData){
                let image  = new Image({})
                image.fileData = fileData
                image.url      = `images/${fileData.filename}`
                image.originalFileName = fileData.originalname
                await image.save()
                return image;
            }

            static get relations(){
                return {
                    userAvatar: "avatar", //if it is ava
                    ad: ["images"],
                    message: "image",
                }
            }

        }
        SlicedSavable.addClass(Image)


        class Ad extends OwnerSlicedSavable {
            constructor(...params){
                super(...params)
            }


            static get relations(){
                return {
                    images: "ad", //if it is ava
                    comments: "ad",
                }
            }

            static get guestRelations(){
                return ["comments"]
            }

        }
        SlicedSavable.addClass(Ad)


        class Comment extends OwnerSlicedSavable {
            constructor(...params){
                super(...params)
                //TODO: calc likes count by getter (no two-way relation for this to avoid overflow on many Kilos of likes
                //cached like count, which incremented and decremented
            }


            static get relations(){
                return {
                    ad: ["comments"],
                    answers: "answerTo",
                    answerTo: ["answers"],
                }
            }

            static get guestRelations(){
                return ["answers"]
            }
        }
        SlicedSavable.addClass(Comment)


        class Message extends OwnerSlicedSavable {
            constructor(...params){
                super(...params)
            }


            static get relations(){
                return {
                    to: ["incomings"],
                    image: "message",
                }
            }

            //static get guestRelations(){
                //return ["to"]
            //}

            async save(...params){
                if (this.to) this.___permissions.read.push(this.to._id.toString())
                return await super.save(...params)
            }


            static get defaultPermissions(){
                return {
                    //savable refs, objectid's, words like 'tags' or 'roles'
                    read: ['owner'],
                    write: ['owner'],
                    create: ['user'],

                    /*permission
                     * TODO: permissions for read and write permissions
                     *
                     */
                }
            }
        }
        SlicedSavable.addClass(Message)



        const thisUser = await Savable.m.User.findOne({_id: ObjectID(id)})

        return {models: {
                            SlicedSavable, ...SlicedSavable.classes
                        }, 
                thisUser}
    }

    return {
        Savable, 
        slice,
        getModels
    }
}


