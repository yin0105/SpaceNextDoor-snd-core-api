FROM centos:latest
MAINTAINER Hamza Baig <hamzabaig18@gmail.com>

EXPOSE 8000 

RUN curl -sL https://rpm.nodesource.com/setup_8.x | bash -
RUN yum install nodejs -y
RUN yum install -y epel-release nodejs make gcc-c++
# RUN yum -y install http://mirror.rackspace.com/epel/epel-release-latest-7.noarch.rpm
RUN yum -y install GraphicsMagick-c++-devel
ADD package.json package-lock.json /tmp/
RUN cd /tmp/ && npm install

# moving app and modules into app folder
WORKDIR /app
ADD . /app
RUN rm -rf /app/node_modules
RUN rm -rf tmp
RUN mkdir tmp
RUN mv /tmp/node_modules/ /app/

CMD ["npm", "start"]

