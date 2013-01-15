class User < ActiveRecord::Base
  attr_accessible :avatar
   has_attached_file :avatar,
                :storage => :s3,
                :s3_credentials => "config/s3.yml",
                :path => "/avatar_dev/:id/:filename"            
 validates :avatar, :presence=>{:message=>"Please select a file to upload"}
validates_attachment_presence :avatar
  def self.selected_files_list(ids)
    user=[]
    if !ids.nil?
    ids.each do |id|
      user<<self.find_by_id(id)
    end
    end
    return user
  end
  
end
