import React from 'react'
import { Layout, Menu, theme } from 'antd'
import Style from './Layout.module.less'
import { ItemType, MenuItemType } from 'antd/es/menu/hooks/useItems'

const { Header, Content, Sider } = Layout

const items: ItemType<MenuItemType>[] = []

function LayoutComponent() {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  return (
    <Layout style={{ height: '100%' }}>
      <Sider className={Style.sider}>
        <div className="demo-logo-vertical" />
        <Menu
          theme="light"
          mode="inline"
          defaultSelectedKeys={['4']}
          items={items}
        />
      </Sider>
      <Layout>
        <Header
          className={Style.header}
          style={{ background: colorBgContainer }}
        >
          小强技术预研demo
        </Header>
        <Content style={{ margin: '24px 16px' }}>
          <div
            className={Style.content}
            style={{
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            content
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default LayoutComponent
